"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchUserProfile } from "@/lib/firebase/actions/profile";
import { useXp } from "@/xp/useXp";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";

export default function DebugXpPage() {
  const [serverActionResult, setServerActionResult] = useState<any>(null);
  const [serverActionError, setServerActionError] = useState<string | null>(
    null
  );
  const [isServerActionLoading, setIsServerActionLoading] = useState(false);
  const { xp, refreshXp, isLoading, error } = useXp();
  const [userProfile] = useAtom(userProfileAtom);

  const testServerAction = async () => {
    setIsServerActionLoading(true);
    setServerActionResult(null);
    setServerActionError(null);

    try {
      console.log("Calling fetchUserProfile directly");
      const result = await fetchUserProfile();
      console.log("Server action response:", result);
      setServerActionResult(result);

      if (!result.success) {
        setServerActionError(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error calling server action:", err);
      setServerActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsServerActionLoading(false);
    }
  };

  const testUseXpHook = async () => {
    try {
      console.log("Testing refreshXp from useXp hook");
      await refreshXp();
      console.log("refreshXp completed");
    } catch (err) {
      console.error("Error in refreshXp:", err);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold">XP Debugging Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2 text-sm mb-4">
            <div>
              <strong>XP from useXp hook:</strong> {xp}
            </div>
            <div>
              <strong>Hook Loading:</strong> {isLoading ? "Yes" : "No"}
            </div>
            <div>
              <strong>Hook Error:</strong> {error || "None"}
            </div>
          </div>

          <h3 className="font-medium mb-2">User Profile Atom:</h3>
          <pre className="bg-muted p-4 rounded overflow-auto text-xs max-h-60">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Server Action</h2>
          <div className="space-y-4">
            <Button
              onClick={testServerAction}
              disabled={isServerActionLoading}
              className="w-full"
            >
              {isServerActionLoading
                ? "Testing..."
                : "Test fetchUserProfile Server Action"}
            </Button>

            {serverActionError && (
              <div className="text-red-500 text-sm">
                <strong>Error:</strong> {serverActionError}
              </div>
            )}

            {serverActionResult && (
              <div>
                <h3 className="font-medium mb-2">Server Action Result:</h3>
                <pre className="bg-muted p-4 rounded overflow-auto text-xs max-h-60">
                  {JSON.stringify(serverActionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Test useXp Hook</h2>
        <div className="space-y-4">
          <Button
            onClick={testUseXpHook}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Testing..." : "Test refreshXp from useXp hook"}
          </Button>

          <div>
            <p className="text-sm">
              This will test if the refreshXp function from the useXp hook works
              properly. Check the console logs for results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
