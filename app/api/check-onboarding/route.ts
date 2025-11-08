import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get("clerkUserId");

    console.log("🔍 Checking onboarding for user:", clerkUserId);

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Check if user has completed onboarding
    const { data, error } = await supabase
      .from("users")
      .select(
        "onboarding_completed, phone_number, street_address, clerk_user_id"
      )
      .eq("clerk_user_id", clerkUserId)
      .single();

    console.log("📊 Supabase query result:", { data, error });

    if (error) {
      console.error("❌ Error checking onboarding status:", error);
      // If user not found, they need onboarding
      if (
        error.code === "PGRST116" ||
        error.message?.includes("No rows returned")
      ) {
        console.log("📝 User not found in database, needs onboarding");
        return NextResponse.json({
          onboardingCompleted: false,
          userExists: false,
          message: "User not found in database",
        });
      }

      return NextResponse.json(
        {
          error: "Failed to check onboarding status",
          details: error.message,
          onboardingCompleted: false,
          userExists: false,
        },
        { status: 200 } // Return 200 but with onboarding false for safety
      );
    }

    const onboardingCompleted =
      data.onboarding_completed || (data.phone_number && data.street_address);

    console.log("✅ Onboarding status:", {
      onboardingCompleted: !!onboardingCompleted,
      onboarding_completed: data.onboarding_completed,
      phone_number: !!data.phone_number,
      street_address: !!data.street_address,
    });

    return NextResponse.json({
      onboardingCompleted: !!onboardingCompleted,
      userExists: !!data,
    });
  } catch (error) {
    console.error("Error in check-onboarding API:", error);
    return NextResponse.json(
      {
        error: "Failed to check onboarding status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get("clerkUserId");

    console.log("🔍 Checking onboarding for user:", clerkUserId);

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Check if user has completed onboarding
    const { data, error } = await supabase
      .from("users")
      .select(
        "onboarding_completed, phone_number, street_address, clerk_user_id"
      )
      .eq("clerk_user_id", clerkUserId)
      .single();

    console.log("📊 Supabase query result:", { data, error });

    if (error) {
      console.error("❌ Error checking onboarding status:", error);
      // If user not found, they need onboarding
      if (
        error.code === "PGRST116" ||
        error.message?.includes("No rows returned")
      ) {
        console.log("📝 User not found in database, needs onboarding");
        return NextResponse.json({
          onboardingCompleted: false,
          userExists: false,
          message: "User not found in database",
        });
      }

      return NextResponse.json(
        {
          error: "Failed to check onboarding status",
          details: error.message,
          onboardingCompleted: false,
          userExists: false,
        },
        { status: 200 } // Return 200 but with onboarding false for safety
      );
    }

    const onboardingCompleted =
      data.onboarding_completed || (data.phone_number && data.street_address);

    console.log("✅ Onboarding status:", {
      onboardingCompleted: !!onboardingCompleted,
      onboarding_completed: data.onboarding_completed,
      phone_number: !!data.phone_number,
      street_address: !!data.street_address,
    });

    return NextResponse.json({
      onboardingCompleted: !!onboardingCompleted,
      userExists: !!data,
    });
  } catch (error) {
    console.error("Error in check-onboarding API:", error);
    return NextResponse.json(
      {
        error: "Failed to check onboarding status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
