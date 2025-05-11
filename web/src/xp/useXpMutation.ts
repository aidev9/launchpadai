"use client";

import { useMutation } from "@tanstack/react-query";
import { useXp } from "./useXp";

/**
 * Hook that provides a non-blocking mutation for awarding XP
 *
 * @returns A Tanstack Query mutation object for awarding XP in the background
 *
 * @example
 * ```tsx
 * const xpMutation = useXpMutation();
 *
 * const handleComplete = () => {
 *   // Award XP in the background without blocking UI
 *   xpMutation.mutate("action_id");
 *
 *   // Continue with UI updates immediately
 *   showSuccessMessage();
 * };
 * ```
 */
export function useXpMutation() {
  const { awardXp } = useXp();

  return useMutation({
    mutationFn: (actionId: string) => awardXp(actionId),
    onError: (error) => {
      console.error(`Failed to award XP:`, error);
    },
  });
}
