"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentForm } from "@/components/stripe/payment-form";
import { createUserSubscription, getSubscriptionPlans } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Subscription,
  PlanOption,
  BillingCycle,
  PlanType,
  SubscriptionPlan,
} from "@/lib/firebase/schema";
import { userProfileQueryAtom } from "@/lib/store/user-store";
import { useAtom } from "jotai";

interface UpgradeFormProps {
  currentSubscription: Subscription | null;
}

export default function UpgradeForm({ currentSubscription }: UpgradeFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [{ data: userProfile, isLoading: isProfileLoading }] =
    useAtom(userProfileQueryAtom);

  // For the payment form component
  const formProcessing = isLoading;
  const setFormProcessing = (value: boolean) => setIsLoading(value);

  // Fetch plan options from the server action
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const result = await getSubscriptionPlans();

        if (result.plans) {
          setPlans(result.plans);
        } else {
          console.error("Failed to load plan data");
          setError(
            "Failed to load subscription plans. Please refresh the page."
          );
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load subscription plans. Please refresh the page.");
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Determine plans that are upgrades from current plan
  const getUpgradePlans = () => {
    console.log("Current subscription:", currentSubscription);
    console.log("Available plans:", plans);

    if (!currentSubscription) {
      console.log("No current subscription, returning all non-free plans");
      return plans.filter((p) => p.title !== "Free");
    }

    const currentPlanIndex = plans.findIndex(
      (p) => p.title === currentSubscription.planType
    );

    console.log("Current plan type:", currentSubscription.planType);
    console.log("Current plan index:", currentPlanIndex);

    if (currentPlanIndex === -1) {
      console.log(
        "Current plan not found in plans array, returning all non-free plans"
      );
      return plans.filter((p) => p.title !== "Free");
    }

    console.log(
      "Returning plans with index > current plan index:",
      plans.slice(currentPlanIndex + 1)
    );
    return plans.slice(currentPlanIndex + 1);
  };

  const upgradePlans = getUpgradePlans();

  // Initialize subscription when a plan is selected
  useEffect(() => {
    if (selectedPlan !== null && !clientSecret && showPaymentForm) {
      initializeSubscription();
    }
  }, [selectedPlan, showPaymentForm]);

  const initializeSubscription = async () => {
    if (selectedPlan === null) return;

    try {
      setIsLoading(true);
      setError("");

      const planTitle = plans[selectedPlan].title;
      const price =
        billingCycle === "monthly"
          ? plans[selectedPlan].monthly.price
          : plans[selectedPlan].annual.price;

      // Create a subscription on the server
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planTitle,
          billingCycle: billingCycle,
          price: price,
          email: userProfile?.email,
          name: userProfile?.displayName || userProfile?.email,
        }),
      });

      const responseData = await response.json();

      if (responseData.error) {
        setError(responseData.error);
      } else {
        setClientSecret(responseData.clientSecret);
        setCustomerId(responseData.customerId);
        setSubscriptionId(responseData.subscriptionId);
      }
    } catch (err) {
      setError("Failed to initialize subscription. Please try again.");
      console.error("Subscription creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    paymentIntent: any,
    stripeCustomerId: string
  ) => {
    if (selectedPlan === null) return;
    if (!userProfile?.uid) {
      setError("User profile not found. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const planTitle = plans[selectedPlan].title as PlanType;
      const price =
        billingCycle === "monthly"
          ? plans[selectedPlan].monthly.price
          : plans[selectedPlan].annual.price;

      // Link the subscription to the user
      await createUserSubscription({
        userId: userProfile.uid,
        planType: planTitle,
        billingCycle: billingCycle,
        price: price,
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

  const handleSelectPlan = (index: number) => {
    // Don't allow selecting current plan
    if (
      currentSubscription &&
      plans[index].title === currentSubscription.planType
    ) {
      return;
    }

    setSelectedPlan(index);
    setShowPaymentForm(true);

    // Scroll to payment form
    setTimeout(() => {
      document
        .getElementById("payment-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Get the current plan info if a plan is selected
  const selectedPlanInfo: SubscriptionPlan | null =
    selectedPlan !== null && plans.length > 0
      ? {
          planType: plans[selectedPlan].title as PlanType,
          billingCycle: billingCycle,
          price:
            billingCycle === "monthly"
              ? plans[selectedPlan].monthly.price
              : plans[selectedPlan].annual.price,
        }
      : null;

  // Loading state
  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Get display plans (excluding Free)
  const displayPlans = plans.filter((p) => p.title !== "Free");

  if (userProfile) {
    return (
      <div className="space-y-8">
        {isSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-bold text-lg">
              Subscription Upgraded!
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Thank you for upgrading your subscription. Your account has been
              updated with the new plan.
            </AlertDescription>
            <div className="mt-4">
              <Button onClick={() => (window.location.href = "/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </Alert>
        ) : (
          <>
            {/* Plan selection tabs */}
            <Tabs
              defaultValue="annual"
              className="w-full"
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
            >
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-[400px] grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="annual">
                    Annual{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 bg-green-50 text-green-700 border-green-200"
                    >
                      Save 20%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="monthly" className="mt-0">
                {upgradePlans.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>You're already on our highest plan!</AlertTitle>
                    <AlertDescription>
                      You're currently on the highest available plan. Contact us
                      for custom enterprise solutions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayPlans.map((planOption, index) => {
                      const planIndex = plans.findIndex(
                        (p) => p.title === planOption.title
                      );
                      // Skip if this is the current plan or a lower plan
                      const isCurrentPlan =
                        currentSubscription &&
                        currentSubscription.planType === planOption.title;
                      // Use !! to ensure isLowerPlan is a boolean
                      const isLowerPlan = !!(
                        currentSubscription &&
                        plans.findIndex(
                          (p) => p.title === currentSubscription.planType
                        ) > planIndex
                      );
                      const isRecommended = planOption.title === "Builder";

                      console.log(`Plan ${planOption.title}:`, {
                        planIndex,
                        isCurrentPlan,
                        isLowerPlan,
                        currentPlanIndex: currentSubscription
                          ? plans.findIndex(
                              (p) => p.title === currentSubscription.planType
                            )
                          : -1,
                      });

                      // Don't skip lower plans, just disable them
                      console.log(
                        isLowerPlan
                          ? `Plan ${planOption.title} is lower than current plan - will be disabled`
                          : `Plan ${planOption.title} will be selectable`
                      );

                      return (
                        <div className="relative" key={planOption.title}>
                          {isRecommended && (
                            <div className="absolute -top-4 inset-x-0 flex justify-center">
                              <Badge className=" px-4 py-1 text-xs">
                                Recommended
                              </Badge>
                            </div>
                          )}
                          <Card
                            className={`h-full flex flex-col ${
                              isRecommended
                                ? "border-primary shadow-md"
                                : isCurrentPlan
                                  ? "border-blue-200"
                                  : ""
                            }`}
                          >
                            {isCurrentPlan && (
                              <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-blue-500 z-10">
                                Current Plan
                              </Badge>
                            )}
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl">
                                {planOption.title}
                              </CardTitle>
                              <CardDescription>
                                {planOption.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 flex-grow">
                              <div className="mb-4">
                                <span className="text-3xl font-bold">
                                  ${planOption.monthly.price}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  /month
                                </span>
                              </div>
                              <ul className="space-y-2 text-sm mb-6">
                                {planOption.features.map((feature, i) => (
                                  <li key={i} className="flex items-start">
                                    <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button
                                variant={
                                  isCurrentPlan
                                    ? "outline"
                                    : isRecommended
                                      ? "default"
                                      : "outline"
                                }
                                className="w-full"
                                disabled={
                                  isCurrentPlan === true || isLowerPlan === true
                                }
                                onClick={() => handleSelectPlan(planIndex)}
                              >
                                {isCurrentPlan
                                  ? "Current Plan"
                                  : isLowerPlan
                                    ? "Lower Plan"
                                    : selectedPlan === planIndex
                                      ? "Selected"
                                      : "Select Plan"}
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="annual" className="mt-0">
                {upgradePlans.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>You're already on our highest plan!</AlertTitle>
                    <AlertDescription>
                      You're currently on the highest available plan. Contact us
                      for custom enterprise solutions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayPlans.map((planOption, index) => {
                      const planIndex = plans.findIndex(
                        (p) => p.title === planOption.title
                      );
                      // Skip if this is the current plan or a lower plan
                      const isCurrentPlan =
                        currentSubscription &&
                        currentSubscription.planType === planOption.title &&
                        currentSubscription.billingCycle === "annual";
                      // Use !! to ensure isLowerPlan is a boolean
                      const isLowerPlan = !!(
                        currentSubscription &&
                        plans.findIndex(
                          (p) => p.title === currentSubscription.planType
                        ) > planIndex
                      );
                      const isRecommended = planOption.title === "Builder";

                      console.log(`Annual Plan ${planOption.title}:`, {
                        planIndex,
                        isCurrentPlan,
                        isLowerPlan,
                        currentPlanIndex: currentSubscription
                          ? plans.findIndex(
                              (p) => p.title === currentSubscription.planType
                            )
                          : -1,
                      });

                      // Don't skip lower plans, just disable them
                      console.log(
                        isLowerPlan
                          ? `Annual plan ${planOption.title} is lower than current plan - will be disabled`
                          : `Annual plan ${planOption.title} will be selectable`
                      );

                      return (
                        <div className="relative" key={planOption.title}>
                          {isRecommended && (
                            <div className="absolute -top-4 inset-x-0 flex justify-center">
                              <Badge className=" px-4 py-1 text-xs">
                                Recommended
                              </Badge>
                            </div>
                          )}
                          <Card
                            className={`h-full flex flex-col ${
                              isRecommended
                                ? "border-primary shadow-md"
                                : isCurrentPlan
                                  ? "border-blue-200 bg-blue-50"
                                  : ""
                            }`}
                          >
                            {isCurrentPlan && (
                              <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-blue-500 z-10">
                                Current Plan
                              </Badge>
                            )}
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl">
                                {planOption.title}
                              </CardTitle>
                              <CardDescription>
                                {planOption.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 flex-grow">
                              <div className="mb-4">
                                <span className="text-3xl font-bold">
                                  ${planOption.annual.price}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  /year
                                </span>
                              </div>
                              <ul className="space-y-2 text-sm mb-6">
                                {planOption.features.map((feature, i) => (
                                  <li key={i} className="flex items-start">
                                    <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button
                                variant={
                                  isCurrentPlan
                                    ? "outline"
                                    : isRecommended
                                      ? "default"
                                      : "outline"
                                }
                                className="w-full"
                                disabled={
                                  isCurrentPlan === true || isLowerPlan === true
                                }
                                onClick={() => handleSelectPlan(planIndex)}
                              >
                                {isCurrentPlan
                                  ? "Current Plan"
                                  : isLowerPlan
                                    ? "Lower Plan"
                                    : selectedPlan === planIndex
                                      ? "Selected"
                                      : "Select Plan"}
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Payment form */}
            {showPaymentForm && (
              <div
                id="payment-section"
                className="mt-12 border rounded-lg p-6 bg-white"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">
                    Complete Your Upgrade
                  </h3>
                  {selectedPlanInfo && (
                    <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                      <div>
                        <p className="font-medium text-lg">
                          {selectedPlanInfo.planType} Plan
                        </p>
                        <p className="text-muted-foreground">
                          {selectedPlanInfo.billingCycle === "monthly"
                            ? "Monthly"
                            : "Annual"}{" "}
                          billing · ${selectedPlanInfo.price}/
                          {selectedPlanInfo.billingCycle === "monthly"
                            ? "month"
                            : "year"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedPlan(null);
                          setShowPaymentForm(false);
                          setClientSecret(null);
                        }}
                      >
                        Change Plan
                      </Button>
                    </div>
                  )}
                </div>

                {clientSecret ? (
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
                      onError={(error) => setError(error)}
                      processing={formProcessing}
                      setProcessing={setFormProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-pulse text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Preparing your payment form...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    );
  }
}
