"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { PricingCard } from "./pricing-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  selectedPlanAtom,
  monthlyPricingPlansAtom,
  annualPricingPlansAtom,
  pricingPlansLoadingAtom,
} from "@/stores/subscriptionStore";
import { BillingCycle, PlanType } from "@/lib/firebase/schema";
import { getSubscriptionPlans } from "@/app/(protected)/upgrade/actions";
import { motion } from "framer-motion";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [monthlyPlans, setMonthlyPlans] = useAtom(monthlyPricingPlansAtom);
  const [annualPlans, setAnnualPlans] = useAtom(annualPricingPlansAtom);
  const [isLoading, setIsLoading] = useAtom(pricingPlansLoadingAtom);
  const setSelectedPlan = useSetAtom(selectedPlanAtom);
  const router = useRouter();

  // Fetch pricing data once when component mounts
  useEffect(() => {
    async function fetchPricingData() {
      // Only fetch if we don't already have the data
      if (monthlyPlans.length > 0 && annualPlans.length > 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getSubscriptionPlans();

        if (result.error || !result.plans) {
          console.error("Error fetching pricing data:", result.error);
          return;
        }

        // Transform subscription plans to pricing card format for both billing cycles
        const formattedMonthlyPlans = result.plans.map((plan) => ({
          title: plan.title,
          price: plan.monthly.price,
          description: plan.description,
          features: plan.features.map((feature) => ({ text: feature })),
          buttonText:
            plan.title === "Free"
              ? "Start Free"
              : plan.title === "Explorer"
                ? "Get Started"
                : plan.title === "Builder"
                  ? "Start Building"
                  : "Scale Faster",
          buttonVariant:
            plan.title === "Builder"
              ? "default"
              : ("outline" as "default" | "outline"),
          isPopular: plan.title === "Builder",
        }));

        const formattedAnnualPlans = result.plans.map((plan) => ({
          title: plan.title,
          price: plan.annual.price,
          description: plan.description,
          features: plan.features.map((feature) => ({ text: feature })),
          buttonText:
            plan.title === "Free"
              ? "Start Free"
              : plan.title === "Explorer"
                ? "Get Started"
                : plan.title === "Builder"
                  ? "Start Building"
                  : "Scale Faster",
          buttonVariant:
            plan.title === "Builder"
              ? "default"
              : ("outline" as "default" | "outline"),
          isPopular: plan.title === "Builder",
        }));

        setMonthlyPlans(formattedMonthlyPlans);
        setAnnualPlans(formattedAnnualPlans);
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPricingData();
  }, [
    monthlyPlans,
    annualPlans,
    setMonthlyPlans,
    setAnnualPlans,
    setIsLoading,
  ]);

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
      planType: planTitle as PlanType,
      billingCycle,
      price,
    });

    router.push("/auth/signup_plan");
  };

  // Get the current plans based on billing cycle
  const currentPlans = isAnnual ? annualPlans : monthlyPlans;

  return (
    <section id="pricing" className="bg-muted/50 py-20 scroll-mt-20">
      <div className="container space-y-12">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
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
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {currentPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <PricingCard
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
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground">
            Enterprise plans available for accelerators and incubators.{" "}
            <a href="#" className="text-primary hover:underline">
              Contact us
            </a>{" "}
            for details.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
