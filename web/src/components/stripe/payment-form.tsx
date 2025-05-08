"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PaymentFormProps {
  onError: (error: string) => void;
  onSuccess: (paymentIntent: any, customerId: string) => void;
  clientSecret: string;
  customerId: string;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export function PaymentForm({
  onError,
  onSuccess,
  clientSecret,
  customerId,
  processing,
  setProcessing,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect is only needed for additional authentication steps
          return_url: `${window.location.origin}/auth/signup_plan/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        // Show error to your customer
        setErrorMessage(error.message || "An unexpected error occurred.");
        onError(error.message || "An unexpected error occurred.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded, notify the parent component
        onSuccess(paymentIntent, customerId);
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // If payment requires additional action, redirect will happen automatically
        // due to 'redirect: "if_required"'
        console.log("Payment requires additional action");
      } else {
        // Handle any other status
        setErrorMessage("Something went wrong with your payment.");
        onError("Something went wrong with your payment.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid="payment-form"
    >
      <PaymentElement />

      {errorMessage && (
        <div className="text-sm text-destructive">{errorMessage}</div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || processing}
      >
        {processing ? "Processing..." : "Complete Subscription"}
      </Button>
    </form>
  );
}
