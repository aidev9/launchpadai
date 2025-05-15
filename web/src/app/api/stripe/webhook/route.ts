import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import {
  initializePromptCredits,
  recordPromptPackPurchase,
} from "@/lib/firebase/prompt-credits";

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

  // Handle subscription events
  if (event.type.startsWith("customer.subscription")) {
    const subscription = data as Stripe.Subscription;

    // For subscription creation and updates, call the dedicated handler
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.resumed":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(subscription);
        break;
      default:
        console.log(`Received event: ${event.type}`);
        break;
    }
  }

  // If event type is invoice.paid, call the dedicated handler
  if (event.type === "invoice.paid") {
    const subscription = data as Stripe.Subscription;
    await handleInvoicePaid(subscription);
  }

  // For payment_intent events
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = data as Stripe.PaymentIntent;
    await handlePaymentIntentSucceeded(paymentIntent);
  } else if (event.type.startsWith("payment_intent.")) {
    // Handle other payment intent events if needed
    console.log(`Received payment_intent event: ${event.type}`);
  }
}

// Handle a payment_intent.succeeded event
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const { userId, packId, packName, packCredits, packPrice } =
      paymentIntent.metadata;

    // If this is a prompt pack purchase, handle it
    // if (userId && packId && packName && packCredits && packPrice) {
    //   // Record the purchase
    //   await recordPromptPackPurchase(
    //     userId,
    //     {
    //       id: packId,
    //       name: packName,
    //       description: `${packCredits} prompt credits`,
    //       credits: parseInt(packCredits),
    //       price: parseFloat(packPrice),
    //       priceId: "manual_prompt_purchase", // This is a direct purchase, not a subscription
    //     },
    //     paymentIntent.id,
    //     paymentIntent.customer as string
    //   );

    //   console.log(`Webhook: Processed prompt pack purchase for user ${userId}`);
    // }

    // Continue with any other payment intent handling...

    return true;
  } catch (error) {
    console.error("Error handling payment_intent.succeeded:", error);
    return false;
  }
}

async function handleInvoicePaid(subscription: Stripe.Subscription) {
  // Get the customer ID from the subscription
  const { customer } = subscription;
  if (typeof customer !== "string") return false;

  // Find the user with this customer ID
  const userSnapshot = await adminDb
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customer)
    .limit(1)
    .get();

  if (userSnapshot.empty) {
    console.error("No user found with Stripe customer ID:", customer);
    return false;
  }

  // Update the user's subscription status in Firestore
  await updateUserSubscriptionInFirebase(customer, subscription);
}

// Handle a customer.subscription.created or customer.subscription.updated event
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID from the subscription
    const { customer } = subscription;
    if (typeof customer !== "string") return false;

    // Find the user with this customer ID
    const userSnapshot = await adminDb
      .collection("users")
      .where("subscription.stripeCustomerId", "==", customer)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.error("No user found with Stripe customer ID:", customer);
      return false;
    }

    const userId = userSnapshot.docs[0].id;
    const userData = userSnapshot.docs[0].data();

    // Get the subscription plan type from the subscription metadata or items
    let planType =
      subscription.metadata.planType || userData.subscription.planType;

    // If plan type is not in metadata, try to get it from the first subscription item's price
    if (!planType && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;

      // Map the price ID to a plan type (this depends on your pricing structure)
      if (priceId.includes("explorer")) {
        planType = "explorer";
      } else if (priceId.includes("builder")) {
        planType = "builder";
      } else if (
        priceId.includes("accelerator") ||
        priceId.includes("enterprise")
      ) {
        planType = "enterprise";
      } else {
        planType = "free";
      }
    }

    if (!planType) {
      console.error(
        "Could not determine plan type for subscription:",
        subscription.id
      );
      return false;
    }

    // Update the user's subscription status in Firestore
    await updateUserSubscriptionInFirebase(customer, subscription);

    // Initialize or update prompt credits based on the subscription plan
    await initializePromptCredits(userId, planType);
    console.log(
      `Webhook: Updated prompt credits for user ${userId} with plan ${planType}`
    );

    return true;
  } catch (error) {
    console.error("Error handling subscription change:", error);
    return false;
  }
}

// Update the user's subscription status in Firestore
async function updateUserSubscriptionInFirebase(
  customerId: string,
  subscription: Stripe.Subscription
) {
  const status = subscription.status;
  const usersSnapshot = await adminDb
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customerId)
    .get();

  if (usersSnapshot.empty) {
    console.warn(`No user found with Stripe customer ID: ${customerId}`);
    return;
  }

  // Update each user with this customer ID (should typically be only one)
  const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
    // Only update if this is the subscription we're tracking
    // if (userDoc.data().subscription.stripeSubscriptionId === subscriptionId) {
    return userDoc.ref.update({
      subscription: {
        ...userDoc.data().subscription,
        status,
      },
      // Update additional fields as needed, e.g., subscription end date
      updatedAt: getCurrentUnixTimestamp(),
    });
    // }
  });

  return await Promise.all(updatePromises.filter(Boolean));
}
