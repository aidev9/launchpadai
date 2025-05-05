"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    // Check if the publishable key exists
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error(
        "Stripe publishable key is missing. Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your environment variables."
      );
    }
    
    // Use the publishable key from environment variables
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};
