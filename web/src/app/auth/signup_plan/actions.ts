"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getPlanPriceId } from "@/lib/stripe/server";
import { actionClient } from "@/lib/action";
import { awardXpPoints } from "@/xp/server-actions";
import { z } from "zod";
import { Resend } from "resend";
import SubscriptionConfirmation from "@/lib/emails/subscription-confirmation";

import Stripe from "stripe";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getSubscriptionPlans } from "@/app/(protected)/upgrade/actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema for subscription form data
const subscriptionFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  company: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  planType: z.enum(["Explorer", "Builder", "Accelerator"]),
  billingCycle: z.enum(["monthly", "annual"]),
  price: z.number(),
  paymentIntentId: z.string(),
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

export const createSubscriptionAction = actionClient
  .schema(subscriptionFormSchema)
  .action(
    async ({
      parsedInput: {
        name,
        email,
        password,
        company,
        role,
        phone,
        planType,
        billingCycle,
        price,
        paymentIntentId,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    }: {
      parsedInput: SubscriptionFormData;
    }) => {
      try {
        // 1. Create a Firebase user
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });

        const uid = userRecord.uid;

        // 2. Update the Stripe customer with Firebase UID
        try {
          await stripe.customers.update(stripeCustomerId, {
            metadata: {
              firebaseUid: uid,
            },
          });
        } catch (stripeError) {
          console.error("Stripe customer error:", stripeError);
          // Delete the Firebase user if Stripe fails
          await adminAuth.deleteUser(uid);
          return {
            success: false,
            error: "Failed to update payment account.",
          };
        }

        // 3. Update the subscription metadata with Firebase UID
        try {
          await stripe.subscriptions.update(stripeSubscriptionId, {
            metadata: {
              firebaseUid: uid,
            },
          });
        } catch (subscriptionError) {
          console.error("Subscription update error:", subscriptionError);
          // Delete the Firebase user if subscription update fails
          await adminAuth.deleteUser(uid);
          return {
            success: false,
            error: "Failed to update subscription.",
          };
        }

        // 4. Update Firestore with user data and subscription info
        await adminDb.collection("users").doc(uid).set({
          name,
          email,
          company,
          role,
          phone,
          provider: "email",
          userType: "user",
          subscription: planType.toLowerCase(),
          billingCycle,
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionStatus: "incomplete", // Will be updated by webhook
          xp: 0,
          createdAt: getCurrentUnixTimestamp(),
        });

        // 5. Send confirmation email
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@launchpadai.io",
            to: email,
            subject: "Welcome to LaunchpadAI - Subscription Confirmation",
            react: SubscriptionConfirmation({
              name,
              planType,
              price,
              billingCycle,
            }),
          });
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          // Don't fail the whole process if just the email fails
        }

        // 6. Award XP for signing up
        await awardXpPoints("signup", uid);

        return {
          success: true,
          message: "Your account has been created successfully.",
          userId: uid,
        };
      } catch (error) {
        console.error("Error in createSubscriptionAction:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred during signup",
        };
      }
    }
  );

// Define type for the email check response
type EmailCheckResponse =
  | { data: { exists: boolean }; error?: undefined }
  | { error: string; data?: undefined };

export const checkEmailExists = actionClient
  .schema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput: { email } }): Promise<EmailCheckResponse> => {
    try {
      // Attempt to get user by email - if this succeeds, the user exists
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        // If the code reaches here without throwing an error, the user exists
        return { data: { exists: true } };
      } catch (authError: any) {
        // If the specific error is user-not-found, the email is available
        if (authError.code === "auth/user-not-found") {
          return { data: { exists: false } };
        }

        // For other Firebase Auth errors, rethrow to be caught by outer try/catch
        throw authError;
      }
    } catch (error) {
      console.error("Error checking email existence:", error);
      return {
        error: "Failed to verify email availability. Please try again.",
      };
    }
  });

// Re-export the getSubscriptionPlans function
export { getSubscriptionPlans };
