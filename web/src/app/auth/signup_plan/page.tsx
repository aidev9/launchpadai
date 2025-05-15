"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { selectedPlanAtom } from "@/stores/subscriptionStore";
import { useRouter } from "next/navigation";
import { SignUpPlanForm } from "./components/sign-up-plan-form";
import Link from "next/link";
import { getSubscriptionPlans } from "./actions";
import { AlphaWarningAlert } from "@/components/alpha-warning-alert";

export default function SignUpPlan() {
  const [selectedPlan] = useAtom(selectedPlanAtom);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate the selected plan against available plans
  useEffect(() => {
    async function validatePlan() {
      if (!selectedPlan || selectedPlan.planType === "Free") {
        router.push("/");
        return;
      }

      try {
        // Fetch available plans from the server
        const planData = await getSubscriptionPlans();

        if (planData.error || !planData.plans) {
          setError("Error loading subscription data");
          return;
        }

        // Validate that the selected plan exists in available plans
        const planExists = planData.plans.some(
          (plan) => plan.title === selectedPlan.planType
        );

        if (!planExists) {
          router.push("/");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error validating plan:", err);
        setError("Error loading plan data");
      }
    }

    validatePlan();
  }, [selectedPlan, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12">
      <div className="container flex w-full flex-col items-center justify-center space-y-6 px-4 sm:w-[350px] md:w-[500px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Join LaunchpadAI
          </h1>
          <p className="text-sm text-muted-foreground">
            You have selected the{" "}
            <span className="font-bold">
              {selectedPlan.planType} plan ({selectedPlan.billingCycle} billing)
            </span>
          </p>
        </div>

        <AlphaWarningAlert />

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>
              Enter your information and set up your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpPlanForm plan={selectedPlan} />
          </CardContent>
        </Card>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
