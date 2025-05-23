"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSubscriptionAction, cancelSubscriptionAction } from "./actions";
import {
  getCurrentUnixTimestamp,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";
import ContentSection from "../components/content-section";
import { useRouter } from "next/navigation";
import {
  subscriptionQueryAtom,
  updateSubscriptionAtom,
} from "@/stores/subscriptionStore";
import { useAtom, useSetAtom } from "jotai";
import { SubscriptionPlan } from "@/lib/firebase/schema";
import { get } from "http";

export default function SubscriptionSettings() {
  // TODO: subscription should be an atom
  // const [subscription, setSubscription] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const router = useRouter();

  // Fetch credits using the query atom
  const [{ data: subscriptionData, isLoading }] = useAtom(
    subscriptionQueryAtom
  );
  const updateSubscription = useSetAtom(updateSubscriptionAtom);

  // Cast subscription data to the expected interface to fix TypeScript errors
  const subscription = subscriptionData as SubscriptionPlan & {
    status?: string;
  };

  // useEffect(() => {
  //   async function fetchSubscription() {
  //     try {
  //       setIsLoading(true);
  //       const result = await getSubscriptionAction();
  //       if (result.success) {
  //         setSubscription(result.subscription);
  //       } else {
  //         console.error("Error fetching subscription:", result.error);
  //         toast({
  //           title: "Error",
  //           description: result.error || "Failed to fetch subscription details",
  //           variant: "destructive",
  //           duration: TOAST_DEFAULT_DURATION,
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error fetching subscription:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }

  //   fetchSubscription();
  // }, [isCanceling]);

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);
      const result = await cancelSubscriptionAction();
      if (result.success) {
        toast({
          title: "Subscription Canceled",
          description: result.message,
          duration: TOAST_DEFAULT_DURATION,
        });
        // Update the subscription to FREE state in the store
        updateSubscription({
          ...subscription,
          planType: "free",
          billingCycle: "monthly",
          price: 0,
          status: "active",
          stripeCustomerId: "",
          stripeSubscriptionId: "",
          createdAt: getCurrentUnixTimestamp(),
          paymentIntentId: "",
        });
        // Update local state to reflect the cancellation
        // setSubscription((prev: any) => ({
        //   ...prev,
        //   status: "canceled",
        // }));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel subscription",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  // Helper function to capitalize the first letter of a string
  const capitalize = (str: string) => {
    try {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (error) {
      console.error("Error capitalizing string:", error);
      return str;
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeVariant = (status: boolean) => {
    if (status === undefined) return "secondary"; // Default to secondary if status is undefined

    if (status) {
      return "default"; // Active subscription
    } else {
      return "destructive"; // Canceled subscription
    }
  };

  return (
    <ContentSection
      title="Subscription"
      desc="Manage your subscription and billing details."
    >
      <>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">
              Loading subscription details...
            </p>
          </div>
        ) : subscription ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Your current subscription plan and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Plan
                    </p>
                    <p className="text-lg font-semibold">
                      {capitalize(subscription?.planType || "Free")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={getStatusBadgeVariant(
                          Boolean(subscription?.active)
                        )}
                      >
                        {subscription?.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Billing Cycle
                    </p>
                    <p className="text-lg font-semibold">
                      {capitalize(subscription?.billingCycle || "monthly")}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="default"
                  onClick={() => router.push("/upgrade")}
                >
                  Upgrade Subscription
                </Button>
                {!("status" in subscription) ||
                subscription.status !== "canceled" ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={
                      isCanceling ||
                      subscription?.planType?.toLowerCase() === "free"
                    }
                  >
                    Cancel Subscription
                  </Button>
                ) : null}
              </CardFooter>
            </Card>

            {/* Additional information card */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past invoices and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To view your billing history and invoices, visit the billing
                  portal.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary">Go to Billing Portal</Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12">
            <h3 className="text-xl font-medium">No Subscription Found</h3>
            <p className="text-muted-foreground mt-2">
              You don't have an active subscription.
            </p>
            <Button className="mt-6">Upgrade Now</Button>
          </div>
        )}

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription? You'll
                continue to have access until the end of your current billing
                period, but you won't be charged again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCanceling}>
                Keep Subscription
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelSubscription();
                }}
                disabled={isCanceling}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isCanceling ? "Canceling..." : "Yes, Cancel Subscription"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </ContentSection>
  );
}
