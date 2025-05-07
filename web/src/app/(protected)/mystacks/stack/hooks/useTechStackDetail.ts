"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { getTechStack } from "@/lib/firebase/techstacks";
import {
  selectedTechStackAtom,
  selectedTechStackIdAtom,
} from "@/lib/store/techstack-store";
import { useAssetQueries } from "@/hooks/useAssetQueries";

/**
 * Enhanced tech stack detail hook using React Query for asset management
 */
export function useTechStackDetailWithQuery() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [selectedTechStackId, setSelectedTechStackId] = useAtom(
    selectedTechStackIdAtom
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isDownloading, setIsDownloading] = useState(false);

  // Use the new React Query hook for assets
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
  } = useAssetQueries(selectedTechStack?.id);

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

  // Fetch tech stack if not in state
  useEffect(() => {
    const fetchTechStack = async () => {
      if (!selectedTechStack && selectedTechStackId) {
        setIsLoading(true);
        try {
          console.log(
            `[useTechStackDetail] Fetching tech stack ${selectedTechStackId}`
          );
          const result = await getTechStack(selectedTechStackId);
          if (result.success && result.techStack) {
            console.log(
              `[useTechStackDetail] Successfully fetched tech stack:`,
              result.techStack.name
            );
            setSelectedTechStack(result.techStack);
          } else {
            console.error(
              `[useTechStackDetail] Failed to fetch tech stack:`,
              result.error
            );
            setError(result.error || "Failed to fetch tech stack");
          }
        } catch (error) {
          console.error(
            `[useTechStackDetail] Error fetching tech stack:`,
            error
          );
          setError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred"
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTechStack();
  }, [selectedTechStack, selectedTechStackId, setSelectedTechStack]);

  // Redirect if no tech stack is selected
  useEffect(() => {
    if (!selectedTechStack && !selectedTechStackId && !isLoading) {
      router.push("/mystacks");
    }
  }, [selectedTechStack, selectedTechStackId, isLoading, router]);

  // Refetch assets when tab changes to assets
  useEffect(() => {
    if (activeTab === "assets" && selectedTechStack?.id) {
      console.log(`[useTechStackDetail] Tab changed to assets, refetching`);
      refetchAssets();
    }
  }, [activeTab, selectedTechStack?.id, refetchAssets]);

  // Log when assets change
  useEffect(() => {
    if (assets.length > 0) {
      console.log(
        `[useTechStackDetail] Assets updated:`,
        assets.map((a: TechStackAsset) => ({
          id: a.id,
          type: a.assetType,
          status: getAssetStatus(a),
        }))
      );
    }
  }, [assets, getAssetStatus]);

  // No need to calculate anyAssetsGenerating locally, we get it from useAssetQueries

  // Generate content for an asset
  const handleGenerateContent = async (
    asset: TechStackAsset,
    instructions?: string
  ) => {
    if (!selectedTechStack || !asset.id) return;

    console.log(
      `[useTechStackDetail] Generating content for asset ${asset.id} (${asset.assetType})`
    );

    try {
      await generateAsset({
        assetId: asset.id,
        assetType: asset.assetType,
        techStackDetails: selectedTechStack,
        userInstructions: instructions,
      });

      console.log(`[useTechStackDetail] Content generation initiated`);
    } catch (error) {
      console.error(`[useTechStackDetail] Error generating content:`, error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
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
    setIsGeneratingContent: () => {}, // No-op as this is handled by React Query
    isDownloading,
    setIsDownloading,
    generatingAssets,
    onGenerateContent: handleGenerateContent,
    refetchAssets,
  };
}
