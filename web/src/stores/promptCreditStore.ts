"use client";

import { atom, createStore } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { QueryClient } from "@tanstack/react-query";
import {
  PromptCredit,
  PromptCreditPack,
  defaultPromptPacks,
} from "@/lib/firebase/schema";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";

// Create a Jotai store
const myStore = createStore();

// Create a query client atom for accessing the QueryClient instance
// Important: We use null as initial value and will set it in the JotaiProvider component
export const queryClientAtom = atom<QueryClient | null>(null);

// Helper function to safely get the query client
export function getQueryClient(): QueryClient {
  const client = myStore.get(queryClientAtom);
  if (!client) {
    throw new Error(
      "QueryClient not available. Make sure you're using this within a QueryClientProvider and JotaiProvider."
    );
  }
  return client;
}

// Atom to store the current user's prompt credits
export const promptCreditsAtom = atom<PromptCredit | null>(null);

export const promptCreditsQueryAtom = atomWithQuery<PromptCredit | null>(
  (get) => ({
    queryKey: ["promptCreditsQueryAtom"],
    queryFn: async ({ queryKey }) => {
      try {
        const userId = await getCurrentUserId();
        console.log("[STORE] Fetching prompt credits for userId: ", userId);
        const result = await fetchPromptCredits();
        if (result.success && result.credits) {
          // setPromptCredits(result.credits);
          myStore.set(promptCreditsAtom, result.credits);

          return result.credits;
        } else {
          const dailyCredits = {
            userId,
            dailyCredits: 10,
            monthlyCredits: 300,
            remainingCredits: 10,
            totalUsedCredits: 0,
          };
          // setPromptCredits(dailyCredits);
          return dailyCredits;
        }
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - credits can change during usage
  }),
  // Add this second parameter to get the queryClient dynamically
  (get) => {
    const client = get(queryClientAtom);
    if (!client) throw new Error("QueryClient not initialized");
    return client;
  }
);

// Atom to check if credits are low (below threshold)
export const isLowCreditsAtom = atom((get) => {
  const queryResult = get(promptCreditsQueryAtom);
  const credits = queryResult.data;
  if (!credits) return false;

  // Consider credits low if less than 10% of allocation remains or less than 10 total
  const threshold = Math.max(
    Math.floor((credits.dailyCredits + credits.monthlyCredits) * 0.1),
    10
  );
  return credits.remainingCredits <= threshold;
});

// Atom for available prompt packs
export const promptPacksAtom = atom<PromptCreditPack[]>(defaultPromptPacks);

// Atom for selected pack during purchase flow
export const selectedPromptPackAtom = atom<PromptCreditPack | null>(null);

// Atom for updating prompt credit state
export const updatePromptCreditsAtom = atom(
  null,
  (get, set, credits: PromptCredit) => {
    set(promptCreditsAtom, credits);
  }
);

// Atom for incrementing used credits and decrementing remaining
export const usePromptCreditAtom = atom(null, (get, set) => {
  const currentCredits = get(promptCreditsAtom);
  if (currentCredits && currentCredits.remainingCredits > 0) {
    set(promptCreditsAtom, {
      ...currentCredits,
      remainingCredits: currentCredits.remainingCredits - 1,
      totalUsedCredits: (currentCredits.totalUsedCredits || 0) + 1,
    });
    return true;
  }
  return false;
});

// Atom for adding credits from a purchased pack
// TEMPLATE: Use this function as a template for updting query atoms
export const incrementPromptCreditsAtom = atom(
  null,
  (get, set, amount: number) => {
    try {
      const client = get(queryClientAtom);
      if (!client) {
        console.error("QueryClient not initialized");
        return false;
      }

      const currentCredits = get(promptCreditsQueryAtom)
        .data as PromptCredit | null;
      if (currentCredits) {
        const newCredits = {
          ...currentCredits,
          remainingCredits: currentCredits.remainingCredits + amount,
        };

        client.setQueryData(["promptCreditsQueryAtom"], newCredits);

        // Force a refetch to ensure consistency
        client.invalidateQueries({ queryKey: ["promptCreditsQueryAtom"] });
        return true;
      }
    } catch (error) {
      console.error("Error adding prompt credits:", error);
    }

    return false;
  }
);
