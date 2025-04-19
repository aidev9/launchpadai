"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { z } from "zod";
import { actionClient } from "@/lib/action";
import { returnValidationErrors } from "next-safe-action";

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
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          ); // Add merge option for safety
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
        console.error("Error creating user:", error);

        // Handle specific Firebase Auth errors
        if (error instanceof Error) {
          if (error.message.includes("email-already-exists")) {
            return returnValidationErrors(signupSchema, {
              email: {
                _errors: [
                  "This email is already registered. Please login or use a different email.",
                ],
              },
            });
          }

          if (error.message.includes("invalid-email")) {
            return returnValidationErrors(signupSchema, {
              email: { _errors: ["The email address is not valid."] },
            });
          }

          if (error.message.includes("weak-password")) {
            return returnValidationErrors(signupSchema, {
              password: {
                _errors: [
                  "The password is too weak. Please choose a stronger password.",
                ],
              },
            });
          }

          // Log the specific error information
          console.error("Specific error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }

        return {
          success: false,
          message: "An error occurred during signup. Please try again later.",
        };
      }
    }
  );

// Remove this later
const schema = z.object({
  name: z.string(),
});
