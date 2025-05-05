"use server";

import { userActionClient } from "@/lib/action";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

// Schema for user subscription data
const userSubscriptionSchema = z.object({
  userId: z.string(),
  planType: z.string(),
  billingCycle: z.enum(["monthly", "annual"]),
  price: z.number(),
  paymentIntentId: z.string(),
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string(),
});

// Create a subscription for an authenticated user
export const createUserSubscription = userActionClient
  .schema(userSubscriptionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const {
        userId,
        planType,
        billingCycle,
        price,
        paymentIntentId,
        stripeCustomerId,
        stripeSubscriptionId,
      } = parsedInput;

      // Get the user document reference
      const userRef = adminDb.collection("users").doc(userId);

      // Get the current user data
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error("User does not exist");
      }

      // Update the user with subscription information
      await userRef.update({
        subscription: {
          planType,
          billingCycle,
          price,
          active: true,
          createdAt: new Date(),
          stripeCustomerId,
          stripeSubscriptionId,
          paymentIntentId,
        },
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error creating user subscription:", error);
      return { error: "Failed to update subscription" };
    }
  });
