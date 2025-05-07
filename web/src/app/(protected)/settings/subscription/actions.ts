"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
// import { getCurrentUserId } from "@/lib/firebase/actions/auth";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

/**
 * Server action to get the current user's subscription details from Firestore
 */
export async function getSubscriptionAction() {
  try {
    // Get the current user ID from the server context
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get reference to the user document
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: "User account not found",
      };
    }

    const userData = userDoc.data();

    return {
      success: true,
      subscription: userData?.subscription,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server action to cancel a user's subscription in Stripe and update Firestore
 */
export async function cancelSubscriptionAction() {
  try {
    // Get the current user ID from the server context
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get user document with subscription details
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: "User account not found",
      };
    }

    const userData = userDoc.data();
    const subscriptionId = userData?.stripeSubscriptionId;

    if (!subscriptionId) {
      return {
        success: false,
        error: "No active subscription found",
      };
    }

    // Cancel the subscription at period end in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update subscription status in Firestore
    await userRef.update({
      subscriptionStatus: "canceled",
      updatedAt: new Date().toISOString(),
    });

    // Revalidate the subscription page
    revalidatePath("/settings/subscription");

    return {
      success: true,
      message:
        "Subscription will be canceled at the end of the current billing period",
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
