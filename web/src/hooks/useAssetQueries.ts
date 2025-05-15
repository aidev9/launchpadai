"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TechStackAsset } from "@/lib/firebase/schema";
import {
  getTechStackAssets,
  generateAssetContent as generateAssetContentApi,
} from "@/lib/firebase/techstack-assets";
import { useState } from "react";
import { useAtom } from "jotai";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";

/**
 * Custom hook for managing tech stack assets with React Query
 */
export function useAssetQueries(techStackId: string | undefined) {
  const queryClient = useQueryClient();
  const [optimisticGeneratingAssets, setOptimisticGeneratingAssets] = useState<
    Record<string, boolean>
  >({});
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);

  // Define the return type for the query function
  type AssetsQueryResult = {
    success?: boolean;
    assets?: TechStackAsset[];
    error?: string;
  };

  // Query for fetching assets
  const assetsQuery = useQuery<AssetsQueryResult>({
    queryKey: ["assets", techStackId],
    queryFn: async (): Promise<AssetsQueryResult> => {
      if (!techStackId) {
        return { assets: [] };
      }

      const result = await getTechStackAssets(techStackId);

      if (result.success) {
        // Successfully fetched assets
      } else {
        // Failed to fetch assets
      }

      return result;
    },
    enabled: !!techStackId,
    // Always poll every 5 seconds when on the assets tab
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Define the return type for the mutation function
  type GenerateAssetResult = {
    success: boolean;
    body?: string;
    error?: string;
    needMoreCredits?: boolean;
  };

  // Mutation for generating asset content
  const generateAssetMutation = useMutation({
    mutationFn: async ({
      assetId,
      assetType,
      techStackDetails,
      userInstructions,
    }: {
      assetId: string;
      assetType: string;
      techStackDetails: any;
      userInstructions?: string;
    }): Promise<GenerateAssetResult> => {
      const result = (await generateAssetContentApi(
        techStackId!,
        assetId,
        assetType,
        techStackDetails,
        userInstructions
      )) as GenerateAssetResult;

      // Check if the result indicates insufficient credits
      if (!result.success && result.needMoreCredits) {
        throw {
          message: result.error || "Insufficient prompt credits",
          needMoreCredits: true,
        };
      }

      return result;
    },
    onMutate: async (variables) => {
      // Optimistically update the generating state
      setOptimisticGeneratingAssets((prev) => ({
        ...prev,
        [variables.assetId]: true,
      }));

      // Optimistically update credit count
      if (promptCredits) {
        setPromptCredits({
          ...promptCredits,
          remainingCredits: promptCredits.remainingCredits - 1,
          totalUsedCredits: (promptCredits.totalUsedCredits || 0) + 1,
        });
      }

      // Optionally, you could also cancel outgoing refetches and snapshot previous value here
      // await queryClient.cancelQueries({ queryKey: ['assets', techStackId] });
      // const previousAssets = queryClient.getQueryData(['assets', techStackId]);
      // queryClient.setQueryData(['assets', techStackId], (old: any) => ...update asset.isGenerating... )
      // return { previousAssets };
    },
    onSuccess: async (data, variables) => {
      // Invalidate the assets query to trigger a refetch for the source of truth
      queryClient.invalidateQueries({ queryKey: ["assets", techStackId] });

      // After generation is complete, update credit balance with actual data from server
      try {
        const result = await fetchPromptCredits();
        if (result.success && result.credits) {
          setPromptCredits(result.credits);
        }
      } catch (error) {
        console.error("Failed to update credit balance:", error);
      }

      // Once refetch is complete, the optimistic state for this asset isn't strictly needed
      // but server data will overwrite it. We can clear it if we want to be explicit or if
      // the backend doesn't update isGenerating immediately.
      // For now, we'll rely on the refetch to update the asset.isGenerating flag.
      // Consider clearing if issues persist:
      // setOptimisticGeneratingAssets(prev => ({
      //   ...prev,
      //   [variables.assetId]: false, // Or remove the key
      // }));
    },
    onError: (error: unknown, variables) => {
      // Revert optimistic update on error if necessary, or handle error
      setOptimisticGeneratingAssets((prev) => ({
        ...prev,
        [variables.assetId]: false,
      }));

      // Check if this is an insufficient credits error
      const errorObj = error as any;
      const isInsufficientCredits =
        (typeof error === "object" &&
          error !== null &&
          "needMoreCredits" in errorObj) ||
        (typeof error === "object" &&
          error !== null &&
          "message" in errorObj &&
          String(errorObj.message).toLowerCase().includes("insufficient"));

      // If it's an insufficient credits error, make sure we propagate it
      if (isInsufficientCredits) {
        console.error("Insufficient credits error:", error);
      }

      // If you snapshotted data in onMutate, roll it back here:
      // if (context?.previousAssets) {
      //   queryClient.setQueryData(['assets', techStackId], context.previousAssets);
      // }
    },
    onSettled: (data, error, variables) => {
      // This is called after onSuccess or onError
      // Good place to clear optimistic state if not relying solely on refetch for `isGenerating`
      // For robustness, especially if backend update of `isGenerating` might be delayed
      // or if the asset might not appear in the next refetch immediately with the flag set.
      setOptimisticGeneratingAssets((prev) => {
        const newState = { ...prev };
        delete newState[variables.assetId]; // Remove the key once settled, rely on query data
        return newState;
      });
    },
  });

  // Helper function to get asset status
  const getAssetStatus = (asset: TechStackAsset | undefined) => {
    if (!asset) return "unknown";
    if (asset.isGenerating) return "generating";
    if (asset.recentlyCompleted) return "completed";
    if (asset.needsGeneration) return "pending";
    return "ready";
  };

  // Track which assets are generating
  const generatingAssets: Record<string, boolean> = {};
  (assetsQuery.data?.assets || []).forEach((asset: TechStackAsset) => {
    if (
      asset.id &&
      (asset.isGenerating || optimisticGeneratingAssets[asset.id])
    ) {
      generatingAssets[asset.id] = true;
    }
  });

  return {
    assets: assetsQuery.data?.assets || [],
    isLoading: assetsQuery.isLoading,
    isError: assetsQuery.isError,
    error: assetsQuery.error,
    refetch: assetsQuery.refetch,
    generateAsset: generateAssetMutation.mutate,
    isGenerating: generateAssetMutation.isPending,
    getAssetStatus,
    generatingAssets,
  };
}
