import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";
import { headers } from "next/headers";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Webhook secret from environment variable
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// List of subscription-related events we want to handle
const relevantEvents = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Verify webhook signature
    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    // Construct and verify the event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `⚠️ Webhook signature verification failed: ${errorMessage}`
      );
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Handle the event based on its type
    if (relevantEvents.includes(event.type)) {
      try {
        await handleSubscriptionEvent(event);
      } catch (err) {
        console.error(`Error handling webhook event ${event.type}:`, err);
        return NextResponse.json(
          { error: "Error processing webhook" },
          { status: 500 }
        );
      }
    }

    // Return success response
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Unexpected error in webhook handler:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription-related events and update the database
 */
async function handleSubscriptionEvent(event: Stripe.Event) {
  const data = event.data.object as any;

  // Extract the customer ID to find the associated user
  const customerId = data.customer;
  if (!customerId) {
    console.warn("No customer ID found in webhook event data");
    return;
  }

  // For subscription events
  if (event.type.startsWith("customer.subscription")) {
    const subscriptionId = data.id;
    const status = data.status;

    // Update the user's subscription status in Firestore
    const usersSnapshot = await adminDb
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .get();

    if (usersSnapshot.empty) {
      console.warn(`No user found with Stripe customer ID: ${customerId}`);
      return;
    }

    // Update each user with this customer ID (should typically be only one)
    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      // Only update if this is the subscription we're tracking
      if (userDoc.data().stripeSubscriptionId === subscriptionId) {
        return userDoc.ref.update({
          subscriptionStatus: status,
          // Update additional fields as needed, e.g., subscription end date
          updatedAt: getCurrentUnixTimestamp(),
        });
      }
    });

    await Promise.all(updatePromises);
  }

  // For invoice.paid events - confirms successful payment
  if (event.type === "invoice.paid") {
    // If invoice is for a subscription, update the subscription status
    if (data.subscription) {
      // Fetch the subscription to get the current status
      const subscription = await stripe.subscriptions.retrieve(
        data.subscription
      );

      const usersSnapshot = await adminDb
        .collection("users")
        .where("stripeSubscriptionId", "==", data.subscription)
        .get();

      if (!usersSnapshot.empty) {
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
          return userDoc.ref.update({
            subscriptionStatus: subscription.status,
            updatedAt: getCurrentUnixTimestamp(),
          });
        });

        await Promise.all(updatePromises);
      }
    }
  }

  // For payment_intent events
  if (event.type.startsWith("payment_intent.")) {
    // Handle payment intent events if needed
    console.log(`Received payment_intent event: ${event.type}`);
  }
}
