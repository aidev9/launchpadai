"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getPlanPriceId } from "@/lib/stripe/server";
import { actionClient } from "@/lib/action";
import { awardXpPoints } from "@/xp/server-actions";
import { z } from "zod";
import { Resend } from "resend";
import SubscriptionConfirmation from "@/lib/emails/subscription-confirmation";

import Stripe from "stripe";

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
  paymentMethodId: z.string(),
  stripeCustomerId: z.string(), // Add stripeCustomerId field
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
        paymentMethodId,
        stripeCustomerId,
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

        // 2. Use the existing Stripe customer ID that was passed in
        try {
          // Verify the customer exists and update their metadata with Firebase UID
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
            error: "Failed to find or update payment account.",
          };
        }

        // 3. Create a subscription in Stripe (no need to attach payment method, it's already attached)
        const priceId = await getPlanPriceId(planType, billingCycle);

        try {
          // Create the subscription using the existing customer and payment method
          const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
            metadata: {
              firebaseUid: uid,
            },
          });

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
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            xp: 0,
            createdAt: new Date().toISOString(),
          });

          // 5. Send confirmation email
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || "noreply@launchpadai.com",
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
        } catch (subscriptionError) {
          console.error("Subscription error:", subscriptionError);
          // Delete the Firebase user if subscription fails
          await adminAuth.deleteUser(uid);
          return {
            success: false,
            error: "Failed to create subscription.",
          };
        }
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
