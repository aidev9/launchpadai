"use client";
import UpgradeForm from "./components/upgrade-form";
import { useEffect, useState } from "react";
import { getSubscriptionAction } from "../settings/subscription/actions";
import { toast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { Button } from "@/components/ui/button";

export default function UpgradePage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setIsLoading(true);
        console.log("Fetching subscription data...");
        const result = await getSubscriptionAction();
        console.log("Subscription action result:", result);

        if (result.success) {
          console.log("Setting subscription state:", result.subscription);
          setSubscription(result.subscription);
        } else {
          console.error("Error fetching subscription:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to fetch subscription details",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Subscription</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to accelerate your development workflow and
          build amazing products faster.
        </p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-muted rounded-lg p-6 mb-10 border border-border">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-medium">Your Current Plan</h2>
            <div className="text-2xl font-bold">
              {subscription?.planType || "Free"}
            </div>
            {subscription && (
              <p className="text-sm text-muted-foreground">
                {subscription.billingCycle === "monthly" ? "Monthly" : "Annual"}{" "}
                billing · ${subscription.price}/
                {subscription.billingCycle === "monthly" ? "month" : "year"}
              </p>
            )}
          </div>
          <div>
            <Button
              variant="default"
              size="lg"
              className="whitespace-nowrap font-medium px-6"
              onClick={() => {
                document
                  .querySelector(".grid-cols-1.md\\:grid-cols-3")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Save Money</h3>
          <p className="text-muted-foreground">
            Get more value with our annual plans. Save up to 20% compared to
            monthly billing.
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15v-2" />
              <path d="M12 15v-4" />
              <path d="M15 15v-6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Enhanced Features</h3>
          <p className="text-muted-foreground">
            Unlock premium features like AI coding assistants, advanced
            analytics, and access to our complete prompt library.
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
          <p className="text-muted-foreground">
            Get faster responses and dedicated help when you need it most with
            our premium support options.
          </p>
        </div>
      </div>

      <UpgradeForm currentSubscription={subscription} />
    </div>
  );
}
