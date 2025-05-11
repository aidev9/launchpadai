import { atom } from "jotai";
import {
  PlanType,
  BillingCycle,
  SubscriptionPlan,
  PricingPlan,
  calculateAnnualPrice,
} from "@/lib/firebase/schema";

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
