"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { getTechStack } from "@/lib/firebase/techstacks";
import { selectedTechStackAtom } from "@/lib/store/techstack-store";
import { useTechStackAssets } from "./useTechStackAssets";

/**
 * Enhanced tech stack detail hook using React Server Actions for asset management
 */
export function useTechStackDetailWithQuery() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isDownloading, setIsDownloading] = useState(false);

  // Use the new React Server Actions hook for assets
  const {
    assets,
    isLoading: assetsLoading,
    isError: assetsError,
    error: assetsErrorMessage,
    generateAsset,
    isGenerating,
    getAssetStatus,
    refetch: refetchAssets,
    generatingAssets,
  } = useTechStackAssets();

  // Create a custom state for selected asset that clears the recentlyCompleted flag
  const [selectedAssetState, setSelectedAssetState] =
    useState<TechStackAsset | null>(null);

  // Custom setter for selectedAsset that clears the recentlyCompleted flag
  const setSelectedAsset = (
    asset:
      | TechStackAsset
      | null
      | ((prev: TechStackAsset | null) => TechStackAsset | null)
  ) => {
    // Handle function updater pattern
    if (typeof asset === "function") {
      setSelectedAssetState((prevAsset) => {
        const newAsset = asset(prevAsset);
        return newAsset;
      });
      return;
    }

    // If an asset is selected and it has recentlyCompleted flag, clear it
    if (asset && asset.recentlyCompleted) {
      // Set the selected asset without the recentlyCompleted flag
      setSelectedAssetState({ ...asset, recentlyCompleted: false });
    } else {
      setSelectedAssetState(asset);
    }
  };

  // Use selectedAssetState as the actual selectedAsset value
  const selectedAsset = selectedAssetState;
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);

  // Fetch tech stack if not in state - only when selectedTechStackId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // useEffect(() => {
  //   // Only fetch if we have an ID but no tech stack
  //   if (selectedTechStackId && !selectedTechStack) {
  //     const fetchTechStack = async () => {
  //       setIsLoading(true);
  //       try {
  //         const result = await getTechStack(selectedTechStackId);

  //         if (result.success && result.techStack) {
  //           setSelectedTechStack(result.techStack);
  //         } else {
  //           setError(result.error || "Failed to fetch tech stack");
  //         }
  //       } catch (error) {
  //         setError(
  //           error instanceof Error
  //             ? error.message
  //             : "An unexpected error occurred"
  //         );
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     };

  //     fetchTechStack();
  //   }
  // }, [selectedTechStackId]); // Only depend on the ID, not the tech stack itself

  // // Redirect if no tech stack is selected
  // useEffect(() => {
  //   if (!selectedTechStack && !selectedTechStackId && !isLoading) {
  //     router.push("/mystacks");
  //   }
  // }, [selectedTechStack, selectedTechStackId, isLoading, router]);

  // Refetch assets when tab changes to assets
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Use a ref to track if we've already fetched for this tab change
    const shouldFetch = activeTab === "assets" && selectedTechStack?.id;

    // Only fetch once when the tab changes to assets
    if (shouldFetch) {
      // Add a small delay to avoid immediate refetch
      const timer = setTimeout(() => {
        // Call refetchAssets with false to avoid showing loading spinner
        refetchAssets(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeTab]); // Only depend on tab changes, not the tech stack ID

  // Generate content for an asset - only when user explicitly clicks Generate
  const handleGenerateContent = async (
    asset: TechStackAsset,
    instructions?: string
  ) => {
    if (!selectedTechStack || !asset.id) return;

    try {
      // This is the only place where we should show loading spinner
      // because it's triggered by an explicit user action
      await generateAsset({
        assetId: asset.id,
        assetType: asset.assetType,
        techStackDetails: selectedTechStack,
        userInstructions: instructions,
      });
    } catch (error) {
      console.error(`[useTechStackDetail] Error generating content:`, error);

      // Explicitly detect and handle credit errors with improved error checking
      const errorString = JSON.stringify(error).toLowerCase();
      const isInsufficientCredits =
        errorString.includes("insufficient") ||
        (errorString.includes("credit") && errorString.includes("more")) ||
        (typeof error === "object" &&
          error !== null &&
          (error as any).needMoreCredits === true);

      // Only show toast for non-credit errors, credit errors will show in the alert
      if (!isInsufficientCredits) {
        toast({
          title: "Error",
          description: "Failed to generate content. Please try again.",
          variant: "destructive",
        });
      }

      // Create a proper error object for insufficient credits
      if (isInsufficientCredits) {
        const creditError = {
          needMoreCredits: true,
          message: "Insufficient credits to generate content",
        };
        throw creditError;
      } else {
        // Rethrow the original error
        throw error;
      }
    }
  };

  return {
    router,
    toast,
    selectedTechStack,
    setSelectedTechStack,
    isLoading: isLoading || assetsLoading,
    setIsLoading,
    error:
      error ||
      (assetsError && assetsErrorMessage ? String(assetsErrorMessage) : null),
    setError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activeTab,
    setActiveTab,
    assets,
    selectedAsset,
    setSelectedAsset,
    isAssetDialogOpen,
    setIsAssetDialogOpen,
    isGeneratingContent: isGenerating,
    setIsGeneratingContent: () => {}, // No-op as this is handled by React Server Actions
    isDownloading,
    setIsDownloading,
    generatingAssets,
    onGenerateContent: handleGenerateContent,
    // Pass the showLoading parameter to fetchAssets
    refetchAssets: (showLoading = false) => refetchAssets(showLoading),
  };
}
