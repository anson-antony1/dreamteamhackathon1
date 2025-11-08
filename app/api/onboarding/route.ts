import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

interface OnboardingRequest {
  clerkUserId: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider?: string;
  insurance_id?: string;
  group_number?: string;
}

export async function POST(request: NextRequest) {
  console.log("🎯 Onboarding API called");
  try {
    const body: OnboardingRequest = await request.json();
    console.log("📝 Received onboarding data:", body);

    // Validate required fields
    const {
      clerkUserId,
      phone_number,
      street_address,
      city,
      state,
      zip_code,
      insurance_provider,
      insurance_id,
      group_number,
    } = body;

    if (
      !clerkUserId ||
      !phone_number ||
      !street_address ||
      !city ||
      !state ||
      !zip_code
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: clerkUserId, phone_number, street_address, city, state, zip_code",
        },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const supabase = createSupabaseServerClient();

    // Update the user record with onboarding information
    const { data, error } = await supabase
      .from("users")
      .update({
        phone_number,
        street_address,
        city,
        state,
        zip_code,
        insurance_provider: insurance_provider || null,
        insurance_id: insurance_id || null,
        group_number: group_number || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", clerkUserId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        {
          error: "Failed to save onboarding information",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Onboarding completed for user:", clerkUserId);

    return NextResponse.json({
      message: "Onboarding completed successfully",
      user: data,
    });
  } catch (error) {
    console.error("Error in onboarding:", error);
    return NextResponse.json(
      {
        error: "Failed to process onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

interface OnboardingRequest {
  clerkUserId: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider?: string;
  insurance_id?: string;
  group_number?: string;
}

export async function POST(request: NextRequest) {
  console.log("🎯 Onboarding API called");
  try {
    const body: OnboardingRequest = await request.json();
    console.log("📝 Received onboarding data:", body);

    // Validate required fields
    const {
      clerkUserId,
      phone_number,
      street_address,
      city,
      state,
      zip_code,
      insurance_provider,
      insurance_id,
      group_number,
    } = body;

    if (
      !clerkUserId ||
      !phone_number ||
      !street_address ||
      !city ||
      !state ||
      !zip_code
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: clerkUserId, phone_number, street_address, city, state, zip_code",
        },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const supabase = createSupabaseServerClient();

    // Update the user record with onboarding information
    const { data, error } = await supabase
      .from("users")
      .update({
        phone_number,
        street_address,
        city,
        state,
        zip_code,
        insurance_provider: insurance_provider || null,
        insurance_id: insurance_id || null,
        group_number: group_number || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", clerkUserId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        {
          error: "Failed to save onboarding information",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Onboarding completed for user:", clerkUserId);

    return NextResponse.json({
      message: "Onboarding completed successfully",
      user: data,
    });
  } catch (error) {
    console.error("Error in onboarding:", error);
    return NextResponse.json(
      {
        error: "Failed to process onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
