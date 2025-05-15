"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  PromptCredit,
  PromptCreditPack,
  defaultPromptPacks,
} from "@/lib/firebase/schema";

// Atom to store the current user's prompt credits
export const promptCreditsAtom = atom<PromptCredit | null>(null);

// Derived atom to get the number of remaining credits
export const remainingCreditsAtom = atom(
  (get) => get(promptCreditsAtom)?.remainingCredits || 0
);

// Atom to check if credits are low (below threshold)
export const isLowCreditsAtom = atom((get) => {
  const credits = get(promptCreditsAtom);
  if (!credits) return false;

  // Consider credits low if less than 10% of allocation remains or less than 10 total
  const threshold = Math.max(
    Math.floor((credits.dailyCredits + credits.monthlyCredits) * 0.1),
    10
  );
  return credits.remainingCredits <= threshold;
});

// Atom to check if credits are completely depleted
export const isOutOfCreditsAtom = atom((get) => {
  const credits = get(promptCreditsAtom);
  return credits ? credits.remainingCredits <= 0 : false;
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
export const addPromptCreditsAtom = atom(null, (get, set, amount: number) => {
  const currentCredits = get(promptCreditsAtom);
  if (currentCredits) {
    set(promptCreditsAtom, {
      ...currentCredits,
      remainingCredits: currentCredits.remainingCredits + amount,
    });
    return true;
  }
  return false;
});
