"use client";

import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { userProfileAtom, updateUserProfileAtom } from "@/lib/store/user-store";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { xpActions } from "./points-schedule";
import { fetchUserProfile } from "@/lib/firebase/actions/profile";

interface UseXpReturn {
  xp: number;
  awardXp: (actionId: string) => Promise<void>;
  refreshXp: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useXp(): UseXpReturn {
  const [userProfile] = useAtom(userProfileAtom);
  const [, updateUserProfile] = useAtom(updateUserProfileAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we have a refresh in progress to prevent duplicate calls
  const refreshInProgressRef = useRef(false);

  // Track the last refresh time to prevent too frequent refreshes
  const lastRefreshTimeRef = useRef(0);

  // Get XP from userProfile atom, defaulting to 0 if not present
  const xp = userProfile?.xp ?? 0;

  // Function to refresh XP from server with debouncing
  const refreshXp = async (): Promise<void> => {
    // Skip refresh if we don't have a user profile
    if (!userProfile?.uid) {
      console.log("No user profile available to refresh XP");
      return;
    }

    // Skip if already refreshing
    if (refreshInProgressRef.current) {
      console.log("XP refresh already in progress, skipping");
      return;
    }

    // Debounce: Only allow refreshes every 10 seconds
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < 10000) {
      // 10 seconds
      console.log(
        `Skipping XP refresh - last refresh was ${timeSinceLastRefresh}ms ago`
      );
      return;
    }

    try {
      // Mark refresh as in progress
      refreshInProgressRef.current = true;
      setIsLoading(true);
      setError(null);

      // Update last refresh time
      lastRefreshTimeRef.current = now;

      // Use the server action to fetch the latest profile
      const profileResult = await fetchUserProfile();

      if (profileResult.success && profileResult.profile) {
        // Update the atom with latest profile data
        updateUserProfile(profileResult.profile);
        console.log("XP refreshed from server:", profileResult.profile.xp);
      } else if (profileResult.error) {
        console.error("Error from server action:", profileResult.error);
        setError(profileResult.error);
      } else {
        console.error("Unknown error in server action response");
        setError("Failed to refresh XP");
      }
    } catch (err: any) {
      console.error("Exception refreshing XP:", err);
      setError(err.message || "Unknown error refreshing XP");
    } finally {
      // Ensure this always runs to prevent stuck loading state
      setIsLoading(false);
      // Mark refresh as complete
      refreshInProgressRef.current = false;
    }
  };

  const awardXp = async (actionId: string) => {
    if (!userProfile?.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      const action = xpActions.find((action) => action.id === actionId);

      if (!action) {
        console.error(`XP action not found: ${actionId}`);
        return;
      }

      const userDocRef = doc(clientDb, "users", userProfile.uid);

      // Update local state immediately for better UX
      updateUserProfile({ xp: (userProfile.xp ?? 0) + action.points });

      try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.xp !== undefined) {
            // Update existing user document with xp field
            await updateDoc(userDocRef, {
              xp: increment(action.points),
            });
          } else {
            // User document exists but doesn't have xp field
            await updateDoc(userDocRef, {
              xp: action.points, // Set initial value
            });
          }
        } else {
          // Create user document if it doesn't exist
          await setDoc(
            userDocRef,
            {
              xp: action.points,
            },
            { merge: true }
          );
        }

        console.log(`Awarded ${action.points} XP for ${action.name}`);
      } catch (firestoreError: any) {
        console.error("Error updating XP in Firestore:", firestoreError);

        if (
          firestoreError.code === "failed-precondition" ||
          firestoreError.code === "unavailable" ||
          firestoreError.message?.includes("offline")
        ) {
          console.log("Offline mode: XP will be synced when back online");
          // Don't revert local state - Firestore will automatically sync when online
        } else {
          // Revert local state on non-connectivity errors
          updateUserProfile({
            xp: Math.max(0, (userProfile.xp ?? 0) - action.points),
          });
          setError(
            `Failed to award XP: ${firestoreError.message || "Unknown error"}`
          );
        }
      }
    } catch (error: any) {
      console.error("Error in XP award process:", error);
      setError(`Error awarding XP: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { xp, awardXp, refreshXp, isLoading, error };
}

export default useXp;
