"use server";

import { userActionClient } from "@/lib/action";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { revalidatePath } from "next/cache";
import {
  userSubscriptionSchema,
  calculateAnnualPrice,
  PlanOption,
} from "@/lib/firebase/schema";
import { initializePromptCredits } from "@/lib/firebase/prompt-credits";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Get a user's current subscription
export async function getUserSubscription(userId: string) {
  try {
    // Get the user document
    const subDoc = await adminDb.collection("subscriptions").doc(userId).get();

    if (!subDoc.exists) {
      return null;
    }

    return subDoc.data();
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

// Get price from Stripe by price ID
// TODO: Use this function to fetch prices from Stripe
async function getPriceFromStripe(priceId: string) {
  try {
    const price = await stripe.prices.retrieve(priceId);
    const unit_amount = price?.unit_amount || 0;
    return unit_amount / 100; // Convert from cents to dollars
  } catch (error) {
    console.error("Error fetching price from Stripe:", error);
    return null;
  }
}

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

      // Get the user document
      const userDoc = await adminDb.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();

      // Update the user with subscription information using Unix timestamp
      await adminDb.collection("subscriptions").doc(userId).set(
        {
          uid: userId,
          name: userData?.name,
          email: userData?.email,
          company: userData?.company,
          phone: userData?.phone,
          planType: planType.toLocaleLowerCase(),
          billingCycle,
          price,
          subscriptionStatus: "incomplete", // Will be updated by webhook
          stripeCustomerId,
          stripeSubscriptionId,
          paymentIntentId,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        },
        { merge: true }
      );

      // 2. Update the Stripe customer with Firebase UID
      try {
        await stripe.customers.update(stripeCustomerId, {
          metadata: {
            firebaseUid: userId,
          },
        });
      } catch (stripeError) {
        console.error("Stripe customer error:", stripeError);
      }

      // 3. Update the subscription metadata with Firebase UID
      try {
        await stripe.subscriptions.update(stripeSubscriptionId, {
          metadata: {
            firebaseUid: userId,
          },
        });
      } catch (subscriptionError) {
        console.error("Subscription update error:", subscriptionError);
      }

      // Also update the user's prompt credits based on the new plan
      await initializePromptCredits(userId, planType);
      console.log(
        `Updated prompt credits for user ${userId} with new plan ${planType}`
      );

      revalidatePath("/settings/subscription");
      return { success: true };
    } catch (error) {
      console.error("Error creating user subscription:", error);
      return { error: "Failed to update subscription" };
    }
  });

// Monthly prices from environment variables or fallback values
const explorerMonthlyPrice = parseInt(
  process.env.EXPLORER_MONTHLY_PRICE || "29"
);
const builderMonthlyPrice = parseInt(process.env.BUILDER_MONTHLY_PRICE || "59");
const acceleratorMonthlyPrice = parseInt(
  process.env.ACCELERATOR_MONTHLY_PRICE || "99"
);

// Calculate annual prices with 20% discount
const explorerAnnualPrice = calculateAnnualPrice(explorerMonthlyPrice);
const builderAnnualPrice = calculateAnnualPrice(builderMonthlyPrice);
const acceleratorAnnualPrice = calculateAnnualPrice(acceleratorMonthlyPrice);

// Define plan types and pricing structure
const plans: PlanOption[] = [
  {
    title: "Free",
    description: "Thinkers exploring the possibilities",
    monthly: {
      price: 0,
      description: "Monthly billing",
      priceId: "free",
    },
    annual: {
      price: 0,
      description: "Annual billing",
      priceId: "free",
    },
    features: [
      "Basic tools",
      "Limited prompt library access",
      "Community forum access",
    ],
  },
  {
    title: "Explorer",
    description: "Solo founders just starting out",
    monthly: {
      price: explorerMonthlyPrice,
      description: "Monthly billing",
      priceId:
        process.env.STRIPE_EXPLORER_MONTHLY_PRICE_ID ||
        "price_explorer_monthly",
    },
    annual: {
      price: explorerAnnualPrice,
      description: "Annual billing (save 20%)",
      priceId:
        process.env.STRIPE_EXPLORER_ANNUAL_PRICE_ID || "price_explorer_annual",
    },
    features: [
      "Basic AI tools",
      "Limited prompt library access",
      "Community forum access",
    ],
  },
  {
    title: "Builder",
    description: "Founders actively building their product",
    monthly: {
      price: builderMonthlyPrice,
      description: "Monthly billing",
      priceId:
        process.env.STRIPE_BUILDER_MONTHLY_PRICE_ID || "price_builder_monthly",
    },
    annual: {
      price: builderAnnualPrice,
      description: "Annual billing (save 20%)",
      priceId:
        process.env.STRIPE_BUILDER_ANNUAL_PRICE_ID || "price_builder_annual",
    },
    features: [
      "Full prompt library access",
      "AI assistants for coding and design",
      "Basic learning resources",
      "Community networking",
    ],
  },
  {
    title: "Accelerator",
    description: "Funded startups looking to scale",
    monthly: {
      price: acceleratorMonthlyPrice,
      description: "Monthly billing",
      priceId:
        process.env.STRIPE_ACCELERATOR_MONTHLY_PRICE_ID ||
        "price_accelerator_monthly",
    },
    annual: {
      price: acceleratorAnnualPrice,
      description: "Annual billing (save 20%)",
      priceId:
        process.env.STRIPE_ACCELERATOR_ANNUAL_PRICE_ID ||
        "price_accelerator_annual",
    },
    features: [
      "Everything in Builder",
      "Advanced AI tools",
      "Premium courses",
      "Investor network access",
      "Dedicated support",
    ],
  },
];

export interface UserSubscriptionParams {
  userId: string;
  planType: string;
  billingCycle: "monthly" | "annual";
  price: number;
  paymentIntentId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

// New server action to get subscription plans
// TODO: Refactor this to use Stripe prices
export async function getSubscriptionPlans() {
  try {
    return { plans };
  } catch (error) {
    console.error("Error fetching plan data:", error);
    return { error: "Failed to fetch plan data" };
  }
}
