"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    // Check if the publishable key exists
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn(
        "Stripe publishable key is missing. Using fallback test key. In production, make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your environment variables."
      );
      // In development or if missing, use Stripe test mode key
      // This is a public test key, safe to include in client code
      stripePromise = loadStripe(
        "pk_test_51NvKkXBHXF7sYHj42VvXtOOGzDBpnqQ3nLJF1gUc5gpgJdq31ExlsfdefjtiUxpiK6QyqiSogGRwbJYyE5IQcoSf00F2cyqATu"
      );
    } else {
      // Use the publishable key from environment variables
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};
