"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { z } from "zod";
import { actionClient } from "@/lib/action";
// import { returnValidationErrors } from "next-safe-action";
import { awardXpPoints } from "@/xp/server-actions"; // Import the XP award function

// Schema for signup data validation
const signupSchema = z.object({
  uid: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  // Optional fields from WaitlistForm
  company: z.string().optional(),
  role: z.string().optional(),
  interest: z.string().optional(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
  provider: z
    .enum(["email", "google", "facebook", "twitter", "github"])
    .optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const signupAction = actionClient
  .schema(signupSchema)
  .action(
    async ({
      parsedInput: {
        uid,
        name,
        email,
        password,
        company,
        role,
        interest,
        phone,
        photoURL,
        provider,
      },
    }: {
      parsedInput: SignupFormData;
    }) => {
      try {
        // Create a new user with Firebase Admin SDK only if the provider is email
        if (provider == "email") {
          console.log("[RSA] Creating user with email provider");
          const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
          });
          uid = userRecord.uid;
        }

        // Create a Firestore document for the user
        try {
          console.log("[RSA] Creating user in Firestore", uid);
          await adminDb.collection("users").doc(uid).set(
            {
              name,
              email,
              company,
              role,
              interest,
              phone,
              provider,
              photoURL,
              xp: 0, // Initialize XP field
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          ); // Add merge option for safety

          // Award XP for signing up
          await awardXpPoints("signup", uid);
          console.log(`Awarded XP to user ${uid} for signing up`);
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          // Delete the auth user if Firestore fails
          await adminAuth.deleteUser(uid);
          throw new Error(`Failed to create user profile: ${firestoreError}`);
        }

        return {
          success: true,
          message:
            "Your account has been created successfully. Signing you in...",
          userId: uid,
          firestoreStatus: "skipped",
        };
      } catch (error) {
        console.error("Error in signupAction:", error);
        return {
          success: false,
          serverError:
            error instanceof Error
              ? error.message
              : "An unknown error occurred during signup",
        };
      }
    }
  );
