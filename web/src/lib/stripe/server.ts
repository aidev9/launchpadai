"use server";

import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Updated to the latest API version
});

// Convert price string to Stripe amount (cents)
export const convertToStripeAmount = async (price: number): Promise<number> => {
  // Convert to cents and round to ensure integer value
  return Math.round(price * 100);
};

// Create a Stripe customer
export const createCustomer = async (email: string, name: string) => {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "LaunchpadAI",
    },
  });
};

// Create a subscription for a customer
export const createSubscription = async ({
  customerId,
  planId,
  priceId,
}: {
  customerId: string;
  planId: string;
  priceId: string;
}) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
};

// Helper to get a Stripe product ID based on plan name
export const getPlanProductId = async (planType: string): Promise<string> => {
  // This would typically come from your database or environment variables
  // For now, we're using placeholders
  switch (planType) {
    case "Explorer":
      return process.env.STRIPE_EXPLORER_PRODUCT_ID || "prod_explorer";
    case "Builder":
      return process.env.STRIPE_BUILDER_PRODUCT_ID || "prod_builder";
    case "Accelerator":
      return process.env.STRIPE_ACCELERATOR_PRODUCT_ID || "prod_accelerator";
    default:
      throw new Error(`No product ID found for plan: ${planType}`);
  }
};

// Helper to get a Stripe price ID based on plan and billing cycle
export const getPlanPriceId = async (
  planType: string,
  billingCycle: string
): Promise<string> => {
  // This would typically come from your database or environment variables
  const cycleKey = billingCycle === "annual" ? "ANNUAL" : "MONTHLY";

  if (planType === "Explorer") {
    return billingCycle === "annual"
      ? process.env.STRIPE_EXPLORER_ANNUAL_PRICE_ID || "price_explorer_annual"
      : process.env.STRIPE_EXPLORER_MONTHLY_PRICE_ID ||
          "price_explorer_monthly";
  } else if (planType === "Builder") {
    return billingCycle === "annual"
      ? process.env.STRIPE_BUILDER_ANNUAL_PRICE_ID || "price_builder_annual"
      : process.env.STRIPE_BUILDER_MONTHLY_PRICE_ID || "price_builder_monthly";
  } else if (planType === "Accelerator") {
    return billingCycle === "annual"
      ? process.env.STRIPE_ACCELERATOR_ANNUAL_PRICE_ID ||
          "price_accelerator_annual"
      : process.env.STRIPE_ACCELERATOR_MONTHLY_PRICE_ID ||
          "price_accelerator_monthly";
  }

  throw new Error(`No price ID found for plan: ${planType} (${billingCycle})`);
};
