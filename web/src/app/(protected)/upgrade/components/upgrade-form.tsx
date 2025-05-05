"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentForm } from "@/components/stripe/payment-form";
import { createUserSubscription } from "../actions";

// Define serializable user interface that matches what's passed from the page
interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Define plan types and pricing
const plans = [
  {
    title: "Explorer",
    monthly: {
      price: 9.99,
      description: "Monthly billing",
    },
    annual: {
      price: 99.99,
      description: "Annual billing (save 17%)",
    },
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    title: "Builder",
    monthly: {
      price: 19.99,
      description: "Monthly billing",
    },
    annual: {
      price: 199.99,
      description: "Annual billing (save 17%)",
    },
    features: ["All Explorer features", "Feature 4", "Feature 5"],
  },
  {
    title: "Accelerator",
    monthly: {
      price: 49.99,
      description: "Monthly billing",
    },
    annual: {
      price: 499.99,
      description: "Annual billing (save 17%)",
    },
    features: ["All Builder features", "Feature 6", "Feature 7"],
  },
];

interface UpgradeFormProps {
  user: SerializableUser;
}

export default function UpgradeForm({ user }: UpgradeFormProps) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get the current plan data
  const plan = {
    planType: plans[selectedPlan].title,
    billingCycle: billingCycle,
    price:
      billingCycle === "monthly"
        ? plans[selectedPlan].monthly.price
        : plans[selectedPlan].annual.price,
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    paymentIntent: any,
    stripeCustomerId: string
  ) => {
    try {
      setIsLoading(true);

      // Link the subscription to the user
      await createUserSubscription({
        userId: user.uid,
        planType: plan.planType,
        billingCycle: plan.billingCycle,
        price: plan.price,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: subscriptionId || "",
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Subscription creation error:", err);
      setError("Error completing your subscription. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {isSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Subscription Upgraded!
          </h2>
          <p className="text-green-700 mb-4">
            Thank you for upgrading your subscription. Your account has been
            updated.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {/* Plan selection tabs */}
          <Tabs
            defaultValue="monthly"
            className="w-full"
            onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")}
          >
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="annual">Annual</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((planOption, index) => (
                  <div
                    key={planOption.title}
                    className={`border rounded-lg p-6 ${
                      selectedPlan === index ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {planOption.title}
                    </h3>
                    <p className="text-2xl font-bold mb-1">
                      ${planOption.monthly.price}
                      <span className="text-sm font-normal">/month</span>
                    </p>
                    <p className="text-gray-600 mb-4">
                      {planOption.monthly.description}
                    </p>
                    <ul className="mb-6 space-y-2">
                      {planOption.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <span className="mr-2">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={selectedPlan === index ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedPlan(index)}
                    >
                      {selectedPlan === index ? "Selected" : "Select Plan"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="annual" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((planOption, index) => (
                  <div
                    key={planOption.title}
                    className={`border rounded-lg p-6 ${
                      selectedPlan === index ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {planOption.title}
                    </h3>
                    <p className="text-2xl font-bold mb-1">
                      ${planOption.annual.price}
                      <span className="text-sm font-normal">/year</span>
                    </p>
                    <p className="text-gray-600 mb-4">
                      {planOption.annual.description}
                    </p>
                    <ul className="mb-6 space-y-2">
                      {planOption.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <span className="mr-2">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={selectedPlan === index ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedPlan(index)}
                    >
                      {selectedPlan === index ? "Selected" : "Select Plan"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Payment form */}
          {clientSecret && (
            <div className="mt-8 border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Payment Information</h3>
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  customerId={customerId || ""}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) => setError(err)}
                  processing={isLoading}
                  setProcessing={setIsLoading}
                />
              </Elements>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-6">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
