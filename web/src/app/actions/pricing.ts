"use server";

import {
  BillingCycle,
  PricingPlan,
  calculateAnnualPrice,
} from "@/lib/firebase/schema";

// Define types for pricing data
export interface PricingData {
  plans: PricingPlan[];
}

/**
 * Server action to get pricing information
 * @param billingCycle - monthly or annual
 * @returns pricing data for the specified billing cycle
 */
export async function getPricingData(
  billingCycle: BillingCycle = "monthly"
): Promise<PricingData> {
  // Base pricing data (monthly prices)
  const basePricingData: PricingPlan[] = [
    {
      title: "Free",
      price: parseInt(process.env.STRIPE_BUILDER_LITE_FREE_PRICE || "0"),
      description: "Thinkers exploring the possibilities",
      features: [
        { text: "Basic tools" },
        { text: "Limited prompt library access" },
        { text: "Community forum access" },
      ],
      buttonText: "Start Free",
      buttonVariant: "outline",
    },
    {
      title: "Explorer",
      price: parseInt(process.env.STRIPE_EXPLORER_MONTHLY_PRICE || "29"),
      description: "Solo founders just starting out",
      features: [
        { text: "Basic AI tools" },
        { text: "Limited prompt library access" },
        { text: "Community forum access" },
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      title: "Builder",
      price: parseInt(process.env.STRIPE_BUILDER_MONTHLY_PRICE || "59"),
      description: "Founders actively building their product",
      features: [
        { text: "Full prompt library access" },
        { text: "AI assistants for coding and design" },
        { text: "Basic learning resources" },
        { text: "Community networking" },
      ],
      buttonText: "Start Building",
      buttonVariant: "default",
      isPopular: true,
    },
    {
      title: "Accelerator",
      price: parseInt(process.env.STRIPE_ACCELERATOR_MONTHLY_PRICE || "99"),
      description: "Funded startups looking to scale",
      features: [
        { text: "Everything in Builder" },
        { text: "Advanced AI tools" },
        { text: "Premium courses" },
        { text: "Investor network access" },
        { text: "Dedicated support" },
      ],
      buttonText: "Scale Faster",
      buttonVariant: "outline",
    },
  ];

  // If billing cycle is annual, calculate annual prices (20% discount)
  if (billingCycle === "annual") {
    return {
      plans: basePricingData.map((plan) => ({
        ...plan,
        price: plan.price === 0 ? 0 : calculateAnnualPrice(plan.price),
      })),
    };
  }

  // Return monthly prices
  return { plans: basePricingData };
}
