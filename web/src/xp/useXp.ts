"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { userProfileAtom, updateUserProfileAtom } from "@/lib/store/user-store";
import { xpActions } from "./points-schedule";
// import { awardXpAction } from "@/lib/firebase/actions/xp"; // Assuming this server action exists - COMMENTED OUT FOR NOW

interface UseXpReturn {
  xp: number;
  awardXp: (actionId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useXp(): UseXpReturn {
  const [userProfile] = useAtom(userProfileAtom);
  const [, updateUserProfile] = useAtom(updateUserProfileAtom);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const xp = userProfile?.xp ?? 0;

  const awardXp = async (actionId: string) => {
    if (!userProfile?.uid) {
      console.warn("Cannot award XP: user profile or UID not available.");
      return;
    }

    const action = xpActions.find((a) => a.id === actionId);
    if (!action) {
      const errMsg = `XP action not found: ${actionId}`;
      console.error(errMsg);
      setError(errMsg);
      return;
    }

    const originalXp = userProfile.xp ?? 0;
    const optimisticXp = originalXp + action.points;

    updateUserProfile({ xp: optimisticXp });
    setIsLoading(true);
    setError(null);

    try {
      // 2. Call the server action
      console.log(`Calling awardXpAction for action: ${actionId}`);
      console.warn(
        "awardXpAction call is commented out. Implement the action and uncomment the call."
      );
      // const result = await awardXpAction(actionId); // COMMENTED OUT FOR NOW

      // Mock successful result for now to keep optimistic update
      const result = { success: true, newXp: optimisticXp, error: undefined }; // MOCKED (added error: undefined)

      if (result.success) {
        console.log(
          `Server successfully awarded ${action.points} XP for ${action.name}. New server XP: ${result.newXp}`
        );
        if (result.newXp !== undefined && result.newXp !== optimisticXp) {
          console.warn(
            `Server XP (${result.newXp}) differs from optimistic XP (${optimisticXp}). Updating atom.`
          );
          updateUserProfile({ xp: result.newXp });
        }
      } else {
        console.error("Server action awardXpAction failed:", result.error);
        setError(result.error || "Failed to award XP on server");
        updateUserProfile({ xp: originalXp });
      }
    } catch (err) {
      console.error("Error calling awardXpAction:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error calling award XP action"
      );
      updateUserProfile({ xp: originalXp });
    } finally {
      setIsLoading(false);
    }
  };

  return { xp, awardXp, isLoading, error };
}

export default useXp;
