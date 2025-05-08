import { atom } from "jotai";

export type PlanType = "Free" | "Explorer" | "Builder" | "Accelerator";
export type BillingCycle = "monthly" | "annual";

export interface SubscriptionPlan {
  planType: PlanType;
  billingCycle: BillingCycle;
  price: number;
}

export interface PricingPlan {
  title: string;
  price: number;
  description: string;
  features: { text: string }[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  isPopular: boolean;
}

// Default to free plan with monthly billing
const defaultPlan: SubscriptionPlan = {
  planType: "Free",
  billingCycle: "monthly",
  price: 0,
};

// Atom to store the selected subscription plan
export const selectedPlanAtom = atom<SubscriptionPlan>(defaultPlan);

// Atoms to store pricing data for both billing cycles
export const monthlyPricingPlansAtom = atom<PricingPlan[]>([]);
export const annualPricingPlansAtom = atom<PricingPlan[]>([]);
export const pricingPlansLoadingAtom = atom<boolean>(true);

// Helper function to calculate the annual price with 20% discount
export const calculateAnnualPrice = (monthlyPrice: number): number => {
  if (monthlyPrice === 0) return 0;
  const annual = Math.round(monthlyPrice * 12 * 0.8);
  return annual;
};

// Get plan price based on type and billing cycle
export const getPlanPrice = (
  planType: PlanType,
  billingCycle: BillingCycle
): number => {
  let monthlyPrice = 0;
  switch (planType) {
    case "Explorer":
      monthlyPrice = parseInt(
        process.env.STRIPE_EXPLORER_MONTHLY_PRICE || "29"
      );
      break;
    case "Builder":
      monthlyPrice = parseInt(process.env.STRIPE_BUILDER_MONTHLY_PRICE || "59");
      break;
    case "Accelerator":
      monthlyPrice = parseInt(
        process.env.STRIPE_ACCELERATOR_MONTHLY_PRICE || "99"
      );
      break;
    default:
      monthlyPrice = 0;
  }

  return billingCycle === "annual"
    ? calculateAnnualPrice(monthlyPrice)
    : monthlyPrice;
};
