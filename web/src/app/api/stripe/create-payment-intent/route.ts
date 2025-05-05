import { NextRequest, NextResponse } from "next/server";
import { convertToStripeAmount, getPlanPriceId } from "@/lib/stripe/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Updated to the latest API version
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

    // Convert price to cents for Stripe - fix: added await to properly resolve the Promise
    const amount = await convertToStripeAmount(price);

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

    // Create a payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: customerId,
        metadata: {
          plan,
          billingCycle,
          price,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        customerId,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return NextResponse.json(
        { error: "Failed to create payment intent" },
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
