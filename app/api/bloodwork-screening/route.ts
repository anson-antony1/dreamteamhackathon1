import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import pdfParse from "pdf-parse";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Normal ranges for common bloodwork tests
const NORMAL_RANGES: Record<string, { min: number; max: number; unit: string; name: string }> = {
  glucose: { min: 70, max: 100, unit: "mg/dL", name: "Glucose (Fasting)" },
  hemoglobin: { min: 12, max: 17.5, unit: "g/dL", name: "Hemoglobin" },
  hematocrit: { min: 36, max: 52, unit: "%", name: "Hematocrit" },
  wbc: { min: 4.5, max: 11, unit: "K/μL", name: "White Blood Cell Count" },
  rbc: { min: 4.5, max: 5.9, unit: "M/μL", name: "Red Blood Cell Count" },
  platelets: { min: 150, max: 450, unit: "K/μL", name: "Platelet Count" },
  cholesterol: { min: 0, max: 200, unit: "mg/dL", name: "Total Cholesterol" },
  ldl: { min: 0, max: 100, unit: "mg/dL", name: "LDL Cholesterol" },
  hdl: { min: 40, max: 999, unit: "mg/dL", name: "HDL Cholesterol" },
  triglycerides: { min: 0, max: 150, unit: "mg/dL", name: "Triglycerides" },
  creatinine: { min: 0.6, max: 1.2, unit: "mg/dL", name: "Creatinine" },
  bun: { min: 7, max: 20, unit: "mg/dL", name: "BUN (Blood Urea Nitrogen)" },
  alt: { min: 7, max: 56, unit: "U/L", name: "ALT (Alanine Aminotransferase)" },
  ast: { min: 10, max: 40, unit: "U/L", name: "AST (Aspartate Aminotransferase)" },
  tsh: { min: 0.4, max: 4.0, unit: "mIU/L", name: "TSH (Thyroid Stimulating Hormone)" },
  t4: { min: 4.5, max: 11.2, unit: "μg/dL", name: "T4 (Thyroxine)" },
  vitamin_d: { min: 20, max: 50, unit: "ng/mL", name: "Vitamin D" },
  b12: { min: 200, max: 900, unit: "pg/mL", name: "Vitamin B12" },
  iron: { min: 60, max: 170, unit: "μg/dL", name: "Iron" },
  ferritin: { min: 15, max: 200, unit: "ng/mL", name: "Ferritin" },
};

// Helper function to parse text and extract bloodwork values
function parseBloodworkText(text: string): Array<{ name: string; value: number; unit: string }> {
  const results: Array<{ name: string; value: number; unit: string }> = [];
  const lines = text.split(/\n/);

  // Common patterns for bloodwork results
  const patterns = [
    // Pattern: "Glucose: 95 mg/dL" or "Glucose 95 mg/dL"
    /(?:^|\s)([A-Za-z\s]+(?:\([^)]+\))?)\s*:?\s*(\d+\.?\d*)\s*([a-zA-Z\/%]+)/gi,
    // Pattern: "95 mg/dL Glucose"
    /(\d+\.?\d*)\s*([a-zA-Z\/%]+)\s+([A-Za-z\s]+(?:\([^)]+\))?)/gi,
  ];

  for (const line of lines) {
    // Try to match known test names
    for (const [key, range] of Object.entries(NORMAL_RANGES)) {
      const testNameRegex = new RegExp(range.name.replace(/[()]/g, "\\$&"), "i");
      if (testNameRegex.test(line)) {
        // Extract number and unit from the line
        const valueMatch = line.match(/(\d+\.?\d*)\s*([a-zA-Z\/%]+)/);
        if (valueMatch) {
          const value = parseFloat(valueMatch[1]);
          const unit = valueMatch[2];
          results.push({
            name: range.name,
            value,
            unit,
          });
        }
      }
    }

    // Try generic patterns
    for (const pattern of patterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const testName = match[1]?.trim() || match[3]?.trim();
        const value = parseFloat(match[2] || match[1]);
        const unit = match[3] || match[2];

        if (testName && !isNaN(value) && unit) {
          // Check if this matches a known test
          const knownTest = Object.values(NORMAL_RANGES).find(
            (r) => r.name.toLowerCase().includes(testName.toLowerCase()) || 
                   testName.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])
          );

          if (knownTest) {
            results.push({
              name: knownTest.name,
              value,
              unit,
            });
          }
        }
      }
    }
  }

  // Remove duplicates
  const uniqueResults = results.filter(
    (result, index, self) =>
      index === self.findIndex((r) => r.name === result.name)
  );

  return uniqueResults;
}

// Helper function to analyze a bloodwork value
function analyzeValue(
  name: string,
  value: number,
  unit: string
): { status: "normal" | "low" | "high" | "critical"; normalRange: string; explanation: string } {
  // Find matching normal range
  const range = Object.values(NORMAL_RANGES).find((r) => r.name === name);

  if (!range) {
    return {
      status: "normal",
      normalRange: "Unknown",
      explanation: `This test result was found in your bloodwork. We recommend consulting with your doctor about this value.`,
    };
  }

  // Normalize units if needed (basic conversion)
  let normalizedValue = value;
  if (unit !== range.unit) {
    // Simple unit conversions (can be expanded)
    if (range.unit === "mg/dL" && unit.toLowerCase().includes("mmol")) {
      normalizedValue = value * 18; // Convert mmol/L to mg/dL for glucose
    }
  }

  const { min, max } = range;
  let status: "normal" | "low" | "high" | "critical";
  let explanation: string;

  if (normalizedValue < min) {
    status = normalizedValue < min * 0.7 ? "critical" : "low";
    explanation = `Your ${name} level is below the normal range (${min}-${max} ${range.unit}). This could indicate a deficiency or underlying condition.`;
  } else if (normalizedValue > max) {
    status = normalizedValue > max * 1.5 ? "critical" : "high";
    explanation = `Your ${name} level is above the normal range (${min}-${max} ${range.unit}). This may require medical attention.`;
  } else {
    status = "normal";
    explanation = `Your ${name} level is within the normal range (${min}-${max} ${range.unit}). This is a good sign!`;
  }

  return {
    status,
    normalRange: `${min}-${max} ${range.unit}`,
    explanation,
  };
}

// Helper function to generate summary and recommendations
function generateSummary(values: Array<{ name: string; value: number; unit: string; status: string; explanation: string }>): {
  summary: string;
  recommendations: string[];
} {
  const flagged = values.filter((v) => v.status !== "normal");
  const critical = values.filter((v) => v.status === "critical");
  const high = values.filter((v) => v.status === "high");
  const low = values.filter((v) => v.status === "low");

  let summary = "";
  const recommendations: string[] = [];

  if (critical.length > 0) {
    summary = `⚠️ Your bloodwork shows ${critical.length} critical value(s) that require immediate medical attention. `;
    recommendations.push("Schedule an appointment with your doctor as soon as possible.");
    recommendations.push("If you're experiencing severe symptoms, consider seeking emergency care.");
  } else if (high.length > 0 || low.length > 0) {
    summary = `Your bloodwork shows ${flagged.length} value(s) outside the normal range. `;
    if (high.length > 0) {
      summary += `You have ${high.length} elevated value(s). `;
    }
    if (low.length > 0) {
      summary += `You have ${low.length} low value(s). `;
    }
    recommendations.push("Consult with your healthcare provider about these results.");
    recommendations.push("Consider lifestyle changes like diet and exercise if recommended by your doctor.");
  } else {
    summary = "✅ Great news! All your bloodwork values are within normal ranges. ";
    recommendations.push("Continue maintaining a healthy lifestyle.");
    recommendations.push("Schedule regular check-ups to monitor your health.");
  }

  summary += "Review the detailed results below for more information about each test.";

  return { summary, recommendations };
}

// Force Node.js runtime for PDF parsing
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `bloodwork-${Date.now()}-${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to temp location
    await fs.writeFile(tempFilePath, buffer);

    let extractedText = "";

    try {
      // Extract text based on file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "pdf") {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else if (["jpg", "jpeg", "png", "gif"].includes(fileExtension || "")) {
        // For images, we'll use a simple text extraction approach
        // In production, you'd want to use OCR (Tesseract.js, Google Vision API, etc.)
        extractedText = `[Image file: ${file.name}. OCR processing would extract text here. For now, please ensure your bloodwork results are in PDF format for best results.]`;
        
        // Return a helpful error for images
        return NextResponse.json(
          {
            error: "Image files are not yet supported. Please upload a PDF file of your bloodwork results.",
            suggestion: "Most labs provide results in PDF format. If you only have an image, consider converting it to PDF first.",
          },
          { status: 400 }
        );
      } else {
        // Try to read as text file
        extractedText = buffer.toString("utf-8");
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      return NextResponse.json(
        { error: "Failed to extract text from file. Please ensure it's a valid PDF or text file." },
        { status: 500 }
      );
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFilePath);
      } catch (error) {
        console.error("Error deleting temp file:", error);
      }
    }

    // Parse bloodwork values from extracted text
    const parsedValues = parseBloodworkText(extractedText);

    if (parsedValues.length === 0) {
      return NextResponse.json(
        {
          error: "Could not extract bloodwork values from the file.",
          suggestion: "Please ensure your file contains readable bloodwork results with test names and values.",
          extractedTextPreview: extractedText.substring(0, 500), // For debugging
        },
        { status: 400 }
      );
    }

    // Analyze each value
    const analyzedValues = parsedValues.map((pv) => {
      const analysis = analyzeValue(pv.name, pv.value, pv.unit);
      return {
        ...pv,
        ...analysis,
      };
    });

    // Generate summary and recommendations
    const { summary, recommendations } = generateSummary(analyzedValues);

    const flaggedCount = analyzedValues.filter((v) => v.status !== "normal").length;

    // Create result object
    const result = {
      userId,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      values: analyzedValues,
      summary,
      recommendations,
      flaggedCount,
    };

    // Save to database
    const supabase = createSupabaseServerClient();
    const { data: savedResult, error: dbError } = await supabase
      .from("bloodwork_screenings")
      .insert({
        user_id: userId,
        file_name: file.name,
        results: result,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Still return the result even if database save fails
      return NextResponse.json({
        ...result,
        id: undefined,
        warning: "Results processed but could not be saved to database.",
      });
    }

    return NextResponse.json({
      ...result,
      id: savedResult.id,
    });
  } catch (error) {
    console.error("Error processing bloodwork:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("bloodwork_screenings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bloodwork screenings", details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const transformedData = data.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      fileName: record.file_name,
      uploadedAt: record.created_at,
      values: record.results?.values || [],
      summary: record.results?.summary || "",
      recommendations: record.results?.recommendations || [],
      flaggedCount: record.results?.flaggedCount || 0,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching bloodwork screenings:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

