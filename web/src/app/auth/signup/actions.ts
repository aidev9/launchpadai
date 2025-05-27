"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { z } from "zod";
import { actionClient } from "@/lib/action";
// import { returnValidationErrors } from "next-safe-action";
import { awardXpPoints } from "@/xp/server-actions"; // Import the XP award function
import { Resend } from "resend";
import SignupNotification from "@/lib/emails/signup-notification";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { initializePromptCredits } from "@/lib/firebase/prompt-credits";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

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
  userType: z.enum(["user", "admin", "superadmin"]).optional(),
  subscription: z
    .enum(["free", "explorer", "builder", "accelerator"])
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
        userType,
        subscription,
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
          const userSubscription = subscription || "free";
          await adminDb
            .collection("users")
            .doc(uid)
            .set(
              {
                name,
                email,
                company,
                role,
                interest,
                phone,
                provider,
                photoURL,
                // Set default user type and subscription if not provided
                userType: userType || "user",
                subscription: userSubscription,
                xp: 0, // Initialize XP field
                createdAt: getCurrentUnixTimestamp(),
                updatedAt: getCurrentUnixTimestamp(),
              },
              { merge: true }
            ); // Add merge option for safety

          // Award XP for signing up
          await awardXpPoints("signup", uid);
          console.log(`Awarded XP to user ${uid} for signing up`);

          // Initialize prompt credits based on subscription plan
          await initializePromptCredits(uid, userSubscription);

          // Send notification email to admin
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || "notifications@launchpadai.io",
              to: process.env.EMAIL_ADMIN || "info@launchpadai.io",
              subject:
                "Congratulations! A new user has signed up to LaunchpadAI",
              react: SignupNotification({
                name,
                email,
                subscription: subscription || "free",
                company: company || "Not provided",
                role: role || "Not provided",
                signupPath: "Regular Signup",
              }),
            });
            console.log(
              `Admin notification email sent for new signup: ${email}`
            );
          } catch (emailError) {
            // Log error but don't fail the signup process
            console.error(
              "Error sending admin notification email:",
              emailError
            );
          }
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
