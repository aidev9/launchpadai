import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
      // Try to get user by email
      const userRecord = await adminAuth.getUserByEmail(email);

      // If we get here, the user exists
      return NextResponse.json({ exists: true });
    } catch (error: any) {
      // If error code is auth/user-not-found, the user doesn't exist
      if (error.code === "auth/user-not-found") {
        return NextResponse.json({ exists: false });
      }

      // For any other error, return a server error
      console.error("Error checking email:", error);
      return NextResponse.json(
        { error: "Error checking email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
