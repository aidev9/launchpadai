"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import {
  getPromptPacks,
  createPromptPackPaymentIntent,
  handleSuccessfulPayment,
} from "@/app/(protected)/settings/prompt-credits/purchase/promptCreditPurchaseActions";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { useRouter } from "next/navigation";

/**
 * Hook for fetching available prompt packs to purchase
 * @returns Tanstack Query hook with the available prompt packs
 */
export function usePromptPacks() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["promptPacks"],
    refetchOnWindowFocus: false, // Match project standards
    staleTime: 5 * 60 * 1000, // 5 minutes - packs rarely change
    queryFn: async () => {
      try {
        const result = await getPromptPacks();
        if (!result.success) {
          toast({
            title: "Error",
            description: "Failed to load prompt packs",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
          return [];
        }
        return result.packs || [];
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        console.error(error);
        return [];
      }
    },
  });
}

/**
 * Hook for fetching the current user's prompt credits
 * Syncs with the promptCreditsAtom for global state
 * @returns Tanstack Query hook with the current user's prompt credits
 */
export function usePromptCredits() {
  const { toast } = useToast();
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);

  return useQuery({
    queryKey: ["promptCredits"],
    refetchOnWindowFocus: false, // Match project standards
    staleTime: 30 * 1000, // 30 seconds - credits can change during usage
    queryFn: async () => {
      try {
        const result = await fetchPromptCredits();
        if (result.success && result.credits) {
          setPromptCredits(result.credits);
          return result.credits;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load prompt credits",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
          return null;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        console.error(error);
        return null;
      }
    },
    // Return the existing value from jotai store if available
    initialData: () => promptCredits,
  });
}

/**
 * Hook for creating a payment intent for prompt credit purchase
 * @returns Tanstack Query mutation for creating a payment intent
 */
export function useCreatePaymentIntent() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ packId }: { packId: string }) => {
      const result = await createPromptPackPaymentIntent({ packId });
      // Handle possible undefined result
      if (!result?.data?.success) {
        throw new Error(
          result?.data?.error || "Failed to create payment intent"
        );
      }
      return result.data;
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}

/**
 * Hook for handling successful payment for prompt credits
 * Invalidates the promptCredits query to refresh the balance
 * @returns Tanstack Query mutation for processing a successful payment
 */
export function useHandlePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      paymentIntentId,
      packId,
      customerId,
    }: {
      paymentIntentId: string;
      packId: string;
      customerId: string;
    }) => {
      const result = await handleSuccessfulPayment({
        paymentIntentId,
        packId,
        customerId,
      });

      // Handle possible undefined result
      if (!result?.data?.success) {
        throw new Error(result?.data?.error || "Failed to process payment");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ["promptCredits"] });

      toast({
        title: "Purchase Successful",
        description: "Your credits have been added to your account",
        duration: TOAST_DEFAULT_DURATION,
      });

      // Redirect after success
      setTimeout(() => {
        router.push("/settings/prompt-credits");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description:
          error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}
