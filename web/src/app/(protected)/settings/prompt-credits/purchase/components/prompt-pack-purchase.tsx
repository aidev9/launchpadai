"use client";

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentForm } from "@/components/stripe/payment-form";
import { PromptCreditPack } from "@/lib/firebase/schema";
import { AlertCircle, Check, Coins, Loader2 } from "lucide-react";
import {
  usePromptPacks,
  usePromptCredits,
  useCreatePaymentIntent,
  useHandlePayment,
} from "@/hooks/usePromptCredits";

export function PromptPackPurchase() {
  // State
  const [selectedPack, setSelectedPack] = useState<PromptCreditPack | null>(
    null
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [formProcessing, setFormProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries and mutations
  const {
    data: packs = [],
    isLoading: isLoadingPacks,
    error: packsError,
    refetch: refetchPacks,
  } = usePromptPacks();

  const {
    data: promptCredits,
    isLoading: isLoadingCredits,
    error: creditsError,
  } = usePromptCredits();

  const createPaymentIntent = useCreatePaymentIntent();
  const handlePayment = useHandlePayment();

  // Handle pack selection
  const handleSelectPack = (pack: PromptCreditPack) => {
    setSelectedPack(pack);
    setClientSecret(null);
    setError(null);

    // Create payment intent
    createPaymentIntent.mutate(
      { packId: pack.id },
      {
        onSuccess: (data) => {
          setClientSecret(data.clientSecret || null);
          setCustomerId(data.customerId || null);
        },
        onError: (err) => {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to create payment intent"
          );
        },
      }
    );
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentIntent: any, customerId: string) => {
    if (selectedPack) {
      setFormProcessing(true);
      handlePayment.mutate(
        {
          paymentIntentId: paymentIntent.id,
          packId: selectedPack.id,
          customerId,
        },
        {
          onError: (err) => {
            setError(
              err instanceof Error ? err.message : "Failed to process payment"
            );
            setFormProcessing(false);
          },
        }
      );
    }
  };

  // Handle retry if loading packs fails
  const handleRetryLoadPacks = () => {
    refetchPacks();
  };

  if (isLoadingPacks || isLoadingCredits) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (packsError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Packs</AlertTitle>
        <AlertDescription>
          We couldn't load the prompt credit packs. Please try again.
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleRetryLoadPacks}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (handlePayment.isSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertTitle>Purchase Successful!</AlertTitle>
        <AlertDescription>
          {selectedPack
            ? `${selectedPack.credits} credits have been added to your account.`
            : "Your credits have been added to your account."}{" "}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current balance display */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>
                Your current prompt credit balance
              </CardDescription>
            </div>
            <Coins className="h-8 w-8 text-amber-500 opacity-80" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {promptCredits ? promptCredits.remainingCredits : 0} credits
          </div>
        </CardContent>
      </Card>

      {/* Credit packs selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {packs.map((pack) => (
          <Card
            key={pack.id}
            className={`transition-all hover:shadow-md ${
              selectedPack?.id === pack.id
                ? "border-primary ring-1 ring-primary"
                : ""
            }`}
          >
            <CardHeader>
              <CardTitle>{pack.name}</CardTitle>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">${pack.price}</p>
              <p className="text-sm text-muted-foreground">
                {(pack.price / pack.credits).toFixed(2)} cents per credit
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSelectPack(pack)}
                className="w-full"
                disabled={
                  selectedPack?.id === pack.id || createPaymentIntent.isPending
                }
              >
                {createPaymentIntent.isPending &&
                selectedPack?.id === pack.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : selectedPack?.id === pack.id ? (
                  "Selected"
                ) : (
                  "Select"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Payment section */}
      {selectedPack && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Purchase</CardTitle>
            <CardDescription>
              You are purchasing the {selectedPack.name} for $
              {selectedPack.price}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                  processing={formProcessing || handlePayment.isPending}
                  setProcessing={setFormProcessing}
                />
              </Elements>
            ) : createPaymentIntent.isPending ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
