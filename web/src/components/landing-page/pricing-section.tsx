"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { PricingCard } from "./pricing-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { selectedPlanAtom, BillingCycle } from "@/stores/subscriptionStore";
import { getSubscriptionPlans } from "@/app/(protected)/upgrade/actions";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setSelectedPlan = useSetAtom(selectedPlanAtom);
  const router = useRouter();

  // Fetch pricing data when component mounts or billing cycle changes
  useEffect(() => {
    async function fetchPricingData() {
      setIsLoading(true);
      try {
        const billingCycle: BillingCycle = isAnnual ? "annual" : "monthly";
        const result = await getSubscriptionPlans();

        if (result.error || !result.plans) {
          console.error("Error fetching pricing data:", result.error);
          return;
        }

        // Transform subscription plans to pricing card format
        const formattedPlans = result.plans.map((plan) => ({
          title: plan.title,
          price: isAnnual ? plan.annual.price : plan.monthly.price,
          description: plan.description,
          features: plan.features.map((feature) => ({ text: feature })),
          buttonText: getButtonText(plan.title),
          buttonVariant: plan.title === "Builder" ? "default" : "outline",
          isPopular: plan.title === "Builder",
        }));

        setPricingPlans(formattedPlans);
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPricingData();
  }, [isAnnual]);

  // Get button text based on plan title
  const getButtonText = (planTitle: string) => {
    switch (planTitle) {
      case "Free":
        return "Start Free";
      case "Explorer":
        return "Get Started";
      case "Builder":
        return "Start Building";
      case "Accelerator":
        return "Scale Faster";
      default:
        return "Select Plan";
    }
  };

  // Handle plan selection
  const handlePlanSelection = (planTitle: string, price: number) => {
    const billingCycle: BillingCycle = isAnnual ? "annual" : "monthly";

    // For free plan, redirect to regular signup
    if (planTitle === "Free") {
      router.push("/auth/signup");
      return;
    }

    // For paid plans, set the atom and redirect to plan signup
    setSelectedPlan({
      planType: planTitle as "Explorer" | "Builder" | "Accelerator",
      billingCycle,
      price,
    });

    router.push("/auth/signup_plan");
  };

  return (
    <section id="pricing" className="bg-muted/50 py-20">
      <div className="container space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that's right for your journey
          </p>

          <div className="flex items-center justify-center space-x-2 mt-8">
            <Label htmlFor="billing-toggle" className="text-sm">
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className="text-sm">
              Annual <span className="text-xs text-primary">(Save 20%)</span>
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                billingPeriod={isAnnual ? "year" : "mo"}
                description={plan.description}
                features={plan.features}
                buttonText={plan.buttonText}
                buttonVariant={plan.buttonVariant}
                isPopular={plan.isPopular}
                onClick={() => handlePlanSelection(plan.title, plan.price)}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Enterprise plans available for accelerators and incubators.{" "}
            <a href="#" className="text-primary hover:underline">
              Contact us
            </a>{" "}
            for details.
          </p>
        </div>
      </div>
    </section>
  );
}
