"use client";

import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  selectedTechStackAtom,
  techStackAssetsAtom,
  selectedAssetAtom,
  selectedAssetIdAtom,
  assetsLoadingAtom,
  assetsErrorAtom,
  assetGeneratingAtom,
  generatingAssetsAtom,
  activeTabAtom,
  hasInsufficientCreditsAtom,
} from "@/lib/store/techstack-store";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import {
  fetchTechStackAssets,
  getTechStack,
  generateAssetContentAction,
} from "../actions";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// TODO: Remove this hook and use React Firebase Hooks

/**
 * Custom hook for managing tech stack assets with React Server Actions
 */
export function useTechStackAssets() {
  // State atoms
  const [assets, setAssets] = useAtom(techStackAssetsAtom);
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [selectedAsset, setSelectedAsset] = useAtom(selectedAssetAtom);
  const [selectedAssetId, setSelectedAssetId] = useAtom(selectedAssetIdAtom);
  const [isLoading, setIsLoading] = useAtom(assetsLoadingAtom);
  const [error, setError] = useAtom(assetsErrorAtom);
  const [isGenerating, setIsGenerating] = useAtom(assetGeneratingAtom);
  const [generatingAssets, setGeneratingAssets] = useAtom(generatingAssetsAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [hasInsufficientCredits, setHasInsufficientCredits] = useAtom(
    hasInsufficientCreditsAtom
  );

  const { toast } = useToast();

  // Fetch tech stack
  const fetchTechStackDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getTechStack(selectedTechStack?.id || "");

      if (result.success && result.techStack) {
        console.log("Setting tech stack:", result.techStack);
        setSelectedTechStack(result.techStack);
      } else {
        console.error("Failed to fetch tech stack:", result.error);
        setError(result.error || "Failed to fetch tech stack");
      }
    } catch (err) {
      console.error("Error fetching tech stack:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechStack, setSelectedTechStack, setIsLoading, setError]);

  // Fetch assets
  const fetchAssets = useCallback(
    async (showLoading = false) => {
      if (!selectedTechStack) {
        setAssets([]);
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setError(null);

        const result = await fetchTechStackAssets(selectedTechStack?.id || "");

        if (result.success) {
          setAssets(result.assets || []);
        } else {
          setError(result.error || "Failed to fetch assets");
          setAssets([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAssets([]);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [selectedTechStack, setAssets, setIsLoading, setError]
  );

  // Generate asset content
  const generateAsset = useCallback(
    async ({
      assetId,
      assetType,
      techStackDetails,
      userInstructions,
    }: {
      assetId: string;
      assetType: string;
      techStackDetails: TechStack;
      userInstructions?: string;
    }) => {
      if (!selectedTechStack) return;

      // try {
      //   // Reset insufficient credits state
      //   setHasInsufficientCredits(false);

      //   // Set generating state
      //   setIsGenerating(true);
      //   setGeneratingAssets((prev) => ({
      //     ...prev,
      //     [assetId]: true,
      //   }));

      //   // Optimistically update the UI to show "Generating..." in the editor
      //   setAssets((prevAssets) =>
      //     prevAssets.map((asset) =>
      //       asset.id === assetId
      //         ? {
      //             ...asset,
      //             isGenerating: true,
      //           }
      //         : asset
      //     )
      //   );

      //   // Also update selectedAsset if it's the current asset
      //   setSelectedAsset((prev) => {
      //     if (prev && prev.id === assetId) {
      //       return {
      //         ...prev,
      //         isGenerating: true,
      //       };
      //     }
      //     return prev;
      //   });

      //   // Call the server action
      //   const result = await generateAssetContentAction(
      //     selectedTechStackId,
      //     assetId,
      //     assetType,
      //     techStackDetails,
      //     userInstructions
      //   );

      //   // Check for insufficient credits
      //   // if (!result.success && result.needMoreCredits) {
      //   //   setHasInsufficientCredits(true);
      //   //   throw {
      //   //     message: result.error || "Insufficient prompt credits",
      //   //     needMoreCredits: true,
      //   //   };
      //   // }

      //   // If successful, update the asset in the local state immediately
      //   if (result?.success) {
      //     const updatedAt = getCurrentUnixTimestamp();
      //     // Update assets array
      //     setAssets((prevAssets) =>
      //       prevAssets.map((asset) =>
      //         asset.id === assetId
      //           ? {
      //               ...asset,
      //               body: result.body || "",
      //               updatedAt: updatedAt, // Ensure updatedAt is set
      //               needsGeneration: false,
      //               isGenerating: false,
      //               recentlyCompleted: true,
      //             }
      //           : asset
      //       )
      //     );

      //     setSelectedAsset((prev) => {
      //       if (prev && prev.id === assetId) {
      //         const updatedAsset = {
      //           ...prev,
      //           body: result.body || "",
      //           updatedAt: updatedAt, // Ensure updatedAt is set
      //           needsGeneration: false,
      //           isGenerating: false,
      //           recentlyCompleted: true,
      //         };

      //         return updatedAsset;
      //       }
      //       return prev;
      //     });
      //   }

      //   // Refresh assets without showing loading spinner
      //   fetchAssets(false);

      //   return result;
      // } catch (error) {
      //   // Check if this is an insufficient credits error
      //   const errorObj = error as any;
      //   const isInsufficientCredits =
      //     (typeof error === "object" &&
      //       error !== null &&
      //       "needMoreCredits" in errorObj) ||
      //     (typeof error === "object" &&
      //       error !== null &&
      //       "message" in errorObj &&
      //       String(errorObj.message).toLowerCase().includes("insufficient"));

      //   // Set insufficient credits flag if needed
      //   if (isInsufficientCredits) {
      //     setHasInsufficientCredits(true);
      //   }

      //   // Check for timeout errors
      //   const errorString = String(error);
      //   if (
      //     errorString.includes("DEADLINE_EXCEEDED") ||
      //     errorString.includes("timeout") ||
      //     errorString.includes("timed out")
      //   ) {
      //     // Update the asset with an error message
      //     setAssets((prevAssets) =>
      //       prevAssets.map((asset) =>
      //         asset.id === assetId
      //           ? {
      //               ...asset,
      //               body: "# Content Generation Timed Out\n\nThe AI model took too long to respond. Please try again.",
      //               needsGeneration: false,
      //               isGenerating: false,
      //             }
      //           : asset
      //       )
      //     );

      //     // Show a toast notification
      //     toast({
      //       title: "Generation Timed Out",
      //       description:
      //         "The content generation took too long. Please try again.",
      //       variant: "destructive",
      //     });
      //   }

      //   throw error;
      // } finally {
      //   setIsGenerating(false);

      //   // Clear the generating state for this asset after a delay

      //   setGeneratingAssets((prev) => {
      //     const newState = { ...prev };
      //     delete newState[assetId];
      //     return newState;
      //   });
      // }
    },
    [
      selectedTechStack,
      fetchAssets,
      setIsGenerating,
      setGeneratingAssets,
      setHasInsufficientCredits,
      setAssets,
      toast,
    ]
  );

  // Helper function to get asset status
  const getAssetStatus = useCallback(
    (asset: TechStackAsset | undefined) => {
      if (!asset) return "unknown";
      if (asset.isGenerating || generatingAssets[asset.id || ""])
        return "generating";
      if (asset.recentlyCompleted) return "completed";
      if (asset.needsGeneration) return "pending";
      return "ready";
    },
    [generatingAssets]
  );

  // Fetch tech stack and assets on initial mount
  // useEffect(() => {
  //   if (selectedTechStack) {
  //     // Fetch tech stack details if not already loaded
  //     if (!selectedTechStack || selectedTechStack.id !== selectedTechStackId) {
  //       fetchTechStackDetails();
  //     }

  //     // Fetch assets without showing loading spinner
  //     fetchAssets(false);
  //   }
  // }, [
  //   selectedTechStackId,
  //   selectedTechStack,
  //   fetchTechStackDetails,
  //   fetchAssets,
  // ]);

  // Fetch assets when tab changes to assets
  useEffect(() => {
    if (activeTab === "assets" && selectedTechStack) {
      // Add a small delay to avoid immediate refetch
      const timer = setTimeout(() => {
        // Fetch assets without showing loading spinner
        fetchAssets(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedTechStack, fetchAssets]);

  return {
    assets,
    selectedTechStack,
    selectedAsset,
    setSelectedAsset,
    isLoading,
    error,
    isError: !!error,
    isGenerating,
    generatingAssets,
    activeTab,
    setActiveTab,
    hasInsufficientCredits,
    fetchAssets,
    refetch: fetchAssets,
    generateAsset,
    getAssetStatus,
  };
}
