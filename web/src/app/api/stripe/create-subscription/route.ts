import { NextRequest, NextResponse } from "next/server";
import { getPlanPriceId } from "@/lib/stripe/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15" as any, // Cast to any to bypass TypeScript API version checking
});

export async function POST(request: NextRequest) {
  try {
    const { plan, billingCycle, price, email, name } = await request.json();

    if (!plan || !billingCycle || !price || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get price ID for the plan and billing cycle
    let priceId;
    try {
      priceId = await getPlanPriceId(plan, billingCycle);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid plan or billing cycle" },
        { status: 400 }
      );
    }

    // Create or retrieve customer
    let customerId;
    try {
      // Check if customer already exists
      const customers = await stripe.customers.search({
        query: `email:'${email}'`,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create a new customer
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: {
            source: "LaunchpadAI",
          },
        });
        customerId = customer.id;
      }
    } catch (error) {
      console.error("Error creating/retrieving Stripe customer:", error);
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    // Create a subscription with an incomplete payment intent
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: {
          plan,
          billingCycle,
          price: price.toString(),
        },
      });

      // Get the latest invoice ID from the subscription
      const invoiceId = subscription.latest_invoice;

      if (!invoiceId || typeof invoiceId !== "string") {
        throw new Error("Could not retrieve invoice from subscription");
      }

      // Retrieve the invoice with expanded payment_intent
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
      });

      // Get payment intent - using type assertion for the expanded field
      // TypeScript doesn't recognize expanded fields in the type system
      const paymentIntent = (invoice as any).payment_intent;

      if (!paymentIntent || typeof paymentIntent === "string") {
        throw new Error("Could not retrieve payment intent from invoice");
      }

      const clientSecret = paymentIntent.client_secret;

      if (!clientSecret) {
        throw new Error("Could not retrieve client secret from payment intent");
      }

      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret,
        customerId,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
