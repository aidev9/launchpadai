import { atom } from "jotai";
import {
  BillingCycle,
  SubscriptionPlan,
  PricingPlan,
  calculateAnnualPrice,
  Subscription,
  PlanType,
} from "@/lib/firebase/schema";
import {
  getSubscriptionPlans,
  getUserSubscription,
} from "@/app/(protected)/upgrade/actions";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Default to free plan with monthly billing
// TODO: Update this to include all plan fields
const defaultPlan: SubscriptionPlan = {
  planType: "free",
  billingCycle: "monthly",
  price: 0,
  active: true,
};

// Atom to store the selected subscription plan
export const selectedPlanAtom = atom<SubscriptionPlan>(defaultPlan);

// Atoms to store pricing data for both billing cycles
export const monthlyPricingPlansAtom = atom<PricingPlan[]>([]);
export const annualPricingPlansAtom = atom<PricingPlan[]>([]);
export const pricingPlansLoadingAtom = atom<boolean>(true);

// Subscription query atom
export const subscriptionQueryAtom = atomWithQuery<SubscriptionPlan | null>(
  (get) => ({
    queryKey: ["subscriptionQueryAtom"],
    queryFn: async () => {
      try {
        const userId = await getCurrentUserId();
        console.log("[STORE] Fetching subscription plan for userId: ", userId);
        const sub = await getUserSubscription(userId);
        if (sub && typeof sub === "object") {
          // Ensure we return an object with the correct SubscriptionPlan structure
          return {
            planType: sub.planType as PlanType,
            billingCycle: sub.billingCycle as BillingCycle,
            price: sub.price as number,
            active: true,
          };
        } else {
          return null;
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - credits can change during usage
  }),
  // Add this second parameter to get the queryClient dynamically
  (get) => {
    const client = get(queryClientAtom);
    if (!client) throw new Error("QueryClient not initialized");
    return client;
  }
);

// Atom for updating the subscription plan
export const updateSubscriptionAtom = atom(
  null,
  (get, set, updated: Subscription) => {
    try {
      const queryClient = get(queryClientAtom);
      if (!queryClient) {
        console.error("QueryClient not initialized");
        return false;
      }

      queryClient.setQueryData(["subscriptionQueryAtom"], updated);

      // Force a refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["subscriptionQueryAtom"] });
      return true;
    } catch (error) {
      console.error("Error adding prompt credits:", error);
    }

    return false;
  }
);

// Get plan price based on type and billing cycle
export const getPlanPrice = async (
  planType: string,
  billingCycle: BillingCycle
): Promise<number> => {
  let monthlyPrice = 0;
  const response = await getSubscriptionPlans();

  if ("plans" in response && response.plans) {
    const plan = response.plans.find(
      (p) => p.title.toLocaleLowerCase() === planType.toLocaleLowerCase()
    );

    if (plan) {
      monthlyPrice =
        billingCycle === "annual" ? plan.annual.price : plan.monthly.price;
    } else {
      // Fallback to default plan if not found
      monthlyPrice = defaultPlan.price;
    }
  } else {
    // Handle error case
    monthlyPrice = defaultPlan.price;
  }

  return billingCycle === "annual"
    ? calculateAnnualPrice(monthlyPrice)
    : monthlyPrice;
};
