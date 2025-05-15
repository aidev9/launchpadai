"use server";

import { userActionClient } from "@/lib/action";
import { z } from "zod";
import { defaultPromptPacks } from "@/lib/firebase/schema";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import Stripe from "stripe";
import { recordPromptPackPurchase } from "@/lib/firebase/prompt-credits";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Missing Stripe secret key environment variable");
}

const stripe = new Stripe(stripeSecretKey || "sk_test_dummy_key", {
  apiVersion: "2025-04-30.basil",
});

// Get available prompt packs
export async function getPromptPacks() {
  // Ensure the packs have valid price IDs
  const packs = defaultPromptPacks.map((pack) => {
    // Use environment variable price IDs if available
    let priceId = pack.priceId;

    // Use fallback logic if price ID is missing or invalid
    if (!priceId || priceId.startsWith("price_prompt_pack_")) {
      // Try to get from environment variable first
      const envPriceId = process.env[`STRIPE_PROMPT_PACK_${pack.credits}_ID`];
      if (envPriceId) {
        priceId = envPriceId;
      } else {
        console.warn(`Missing priceId for pack ${pack.id}, using fallback ID`);
        priceId = `price_${pack.id.replace("pack_", "")}`;
      }
    }

    return {
      ...pack,
      priceId,
    };
  });

  return {
    success: true,
    packs,
  };
}

// Create a payment intent for prompt pack purchase
export const createPromptPackPaymentIntent = userActionClient
  .schema(
    z.object({
      packId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      if (!stripeSecretKey) {
        return {
          success: false,
          error: "Stripe is not properly configured. Please contact support.",
        };
      }

      const { packId } = parsedInput;
      const userId = await getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: "You must be logged in to make a purchase.",
        };
      }

      // Find the selected pack
      const selectedPack = defaultPromptPacks.find(
        (pack) => pack.id === packId
      );

      if (!selectedPack) {
        return { success: false, error: "Invalid pack selected" };
      }

      // Get or create a customer
      let customerId;
      try {
        const userRecord = await stripe.customers.search({
          query: `metadata['userId']:'${userId}'`,
        });

        if (userRecord.data.length > 0) {
          customerId = userRecord.data[0].id;
        } else {
          // Create a new customer
          const customer = await stripe.customers.create({
            metadata: {
              userId,
            },
          });
          customerId = customer.id;
        }
      } catch (err) {
        console.error("Error getting/creating Stripe customer:", err);
        return {
          success: false,
          error: "Failed to process customer information. Please try again.",
        };
      }

      // Create a payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(selectedPack.price * 100), // Convert to cents and ensure integer
          currency: "usd",
          customer: customerId,
          metadata: {
            userId,
            packId: selectedPack.id,
            packName: selectedPack.name,
            packCredits: String(selectedPack.credits),
            packPrice: String(selectedPack.price),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        if (!paymentIntent || !paymentIntent.client_secret) {
          throw new Error("Failed to create payment intent");
        }

        return {
          success: true,
          clientSecret: paymentIntent.client_secret,
          customerId,
          packId: selectedPack.id,
        };
      } catch (err) {
        console.error("Error creating payment intent:", err);
        return {
          success: false,
          error:
            "Failed to set up payment. Please try again or contact support.",
        };
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

// Handle successful payment
export const handleSuccessfulPayment = userActionClient
  .schema(
    z.object({
      paymentIntentId: z.string(),
      packId: z.string(),
      customerId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      if (!stripeSecretKey) {
        return {
          success: false,
          error: "Stripe is not properly configured. Please contact support.",
        };
      }

      const { paymentIntentId, packId, customerId } = parsedInput;
      const userId = await getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: "Authentication error. Please log in and try again.",
        };
      }

      // Verify payment intent status
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (err) {
        console.error("Error retrieving payment intent:", err);
        return {
          success: false,
          error: "Failed to verify payment. Please contact support.",
        };
      }

      if (paymentIntent.status !== "succeeded") {
        return {
          success: false,
          error: `Payment has not been completed successfully. Status: ${paymentIntent.status}`,
        };
      }

      // Get the pack details
      const pack = defaultPromptPacks.find((p) => p.id === packId);

      if (!pack) {
        return { success: false, error: "Invalid pack selected" };
      }

      // Record the purchase and update user's credits
      try {
        const result = await recordPromptPackPurchase(
          userId,
          pack,
          paymentIntentId,
          customerId
        );

        // Type check for the expected structure
        if (typeof result === "object" && result !== null) {
          // Handle result as an object that might have success/error properties
          if ("success" in result && result.success === false) {
            throw new Error(
              "error" in result && typeof result.error === "string"
                ? result.error
                : "Failed to record purchase"
            );
          }
        } else {
          // Handle other return types
          console.log("Credits added successfully:", result);
        }

        return {
          success: true,
          message: "Credits added to your account successfully!",
        };
      } catch (err) {
        console.error("Error recording purchase:", err);
        return {
          success: false,
          error:
            "Payment was successful, but we had trouble adding credits to your account. Please contact support.",
        };
      }
    } catch (error) {
      console.error("Error handling successful payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
