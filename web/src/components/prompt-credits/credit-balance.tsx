"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  promptCreditsAtom,
  isLowCreditsAtom,
} from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "../../lib/firebase/actions/promptCreditActions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { getSubscriptionAction } from "@/app/(protected)/settings/subscription/actions";
import { getPromptCreditsByPlan } from "@/lib/firebase/schema";

export function CreditBalance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);
  const [isLowCredits] = useAtom(isLowCreditsAtom);
    const [subscription, setSubscription] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    const loadCredits = async () => {
      try {
        setLoading(true);
        const result = await fetchPromptCredits();
        if (result.success && result.credits) {
          setPromptCredits(result.credits);
        } else {
          setError(result.error || "Failed to load prompt credits");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCredits();
  }, [setPromptCredits]);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setLoading(true);
        const result = await getSubscriptionAction();
        if (result.success && result.subscription) {
          setSubscription(result.subscription);
        } else {
          setError(result.error || "Failed to load subscription");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [setSubscription]);

  const handlePurchaseClick = () => {
    router.push("/settings/prompt-credits/purchase");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prompt Credits</CardTitle>
          <CardDescription>Your AI prompt balance</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prompt Credits</CardTitle>
          <CardDescription>Your AI prompt balance</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // if (!promptCredits) {
  //   return (
  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Prompt Credits</CardTitle>
  //         <CardDescription>Your AI prompt balance</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Alert>
  //           <InfoCircledIcon className="h-4 w-4" />
  //           <AlertTitle>No prompt credits found</AlertTitle>
  //           <AlertDescription>
  //             Your prompt credits may not be initialized yet.
  //           </AlertDescription>
  //         </Alert>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  if (!loading && subscription && promptCredits) {

  // Calculate percentage for the progress bar
  const { monthly: totalCredits } = getPromptCreditsByPlan(subscription.planType);
  
  const percentage =
    totalCredits > 0
      ? Math.max(
          0,
          Math.min(100, (promptCredits.remainingCredits / totalCredits) * 100)
        )
      : 0;

  return (
    <Card className={isLowCredits ? "border-amber-400" : ""}>
      <CardHeader>
        <CardTitle>Prompt Credits</CardTitle>
        <CardDescription>
          {promptCredits.dailyCredits > 0
            ? "Daily prompt credits"
            : "Monthly prompt credits"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">
            {promptCredits.remainingCredits}
          </span>
          <span className="text-muted-foreground">
            {totalCredits > 0 ? (
              <>Remaining out of {totalCredits}</>
            ) : (
              <>credits remaining</>
            )}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />

        {isLowCredits && (
          <Alert variant="warning" className="mt-4 bg-amber-50">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Low Credit Balance</AlertTitle>
            <AlertDescription>
              Your prompt credits are running low. Consider purchasing
              additional credits.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePurchaseClick}
          variant="default"
          className="w-full"
        >
          Purchase More Credits
        </Button>
      </CardFooter>
    </Card>
  );
}
}
