import { useState, Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { useXpMutation } from "@/xp/useXpMutation";
import { useMutation } from "@tanstack/react-query";
import {
  createTechStackAsset,
  updateTechStackAsset,
  deleteTechStackAsset,
} from "@/lib/firebase/techstack-assets";

/**
 * Enhanced asset handlers using React Query for asset generation
 */
export function useAssetHandlersWithQuery(
  selectedTechStack: TechStack | null,
  assets: TechStackAsset[],
  selectedAsset: TechStackAsset | null,
  setSelectedAsset: React.Dispatch<React.SetStateAction<TechStackAsset | null>>,
  setIsAssetDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isDeleteDialogOpen: boolean,
  setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  assetToDelete: TechStackAsset | null,
  setAssetToDelete: React.Dispatch<React.SetStateAction<TechStackAsset | null>>,
  generateAsset: (params: {
    assetId: string;
    assetType: string;
    techStackDetails: any;
    userInstructions?: string;
  }) => void,
  refetchAssets: () => void
) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setIsAssetDialogOpen(true);
  };

  const handleEditAsset = (asset: TechStackAsset) => {
    setSelectedAsset(asset);
    setIsAssetDialogOpen(true);
  };

  const handleSaveAsset = async (formData: {
    title: string;
    body: string;
    tags: string[];
    assetType: "PRD" | "Architecture" | "Tasks" | "Rules" | "Prompt" | "Custom";
  }) => {
    if (!selectedTechStack?.id) return;

    try {
      const assetData = {
        ...formData,
        techStackId: selectedTechStack.id,
      };

      let result;
      if (selectedAsset) {
        // Update existing asset
        result = await updateTechStackAsset(
          selectedTechStack.id,
          selectedAsset.id!,
          assetData
        );
      } else {
        // Create new asset
        result = await createTechStackAsset(assetData);
      }

      if (result.success) {
        // Award XP only for creating new assets, not for updates
        if (!selectedAsset) {
          // Use background mutation instead of awaiting
          xpMutation.mutate("create_stack_asset");

          toast({
            title: "Success",
            description: "Asset created successfully (+15 XP)",
          });
        } else {
          toast({
            title: "Success",
            description: "Asset updated successfully",
          });
        }

        // Refresh assets using React Query
        refetchAssets();
        setIsAssetDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save asset",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = (asset: TechStackAsset) => {
    // Set the asset to delete and open the confirmation dialog
    setAssetToDelete(asset);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAsset = async () => {
    if (!selectedTechStack?.id || !assetToDelete?.id) return;

    try {
      const result = await deleteTechStackAsset(
        selectedTechStack.id,
        assetToDelete.id
      );
      if (result.success) {
        toast({
          title: "Success",
          description: "Asset deleted successfully",
        });

        // Clear selected asset if it was deleted
        if (selectedAsset?.id === assetToDelete.id) {
          setSelectedAsset(null);
        }

        // Refresh assets using React Query
        refetchAssets();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete asset",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = async (
    asset: TechStackAsset,
    userInstructions?: string
  ) => {
    if (!selectedTechStack?.id || !asset.id) return;

    try {
      toast({
        title: "Generating Content",
        description: `Regenerating content for ${asset.title}. This may take a minute...`,
      });

      // Use the React Query mutation to generate content
      generateAsset({
        assetId: asset.id,
        assetType: asset.assetType,
        techStackDetails: selectedTechStack,
        userInstructions,
      });

      console.log(
        `[assetHandlers] Content generation initiated for ${asset.id}`
      );
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Helper function to extract text content from JSON
  const extractTextContent = (content: string): string => {
    // If content is empty or not a string, return as is
    if (!content || typeof content !== "string") {
      return content || "";
    }

    // Check if content looks like JSON (starts with '{' and contains '"text"')
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith("{") && trimmedContent.includes('"text"')) {
      try {
        const parsed = JSON.parse(trimmedContent);
        if (parsed && parsed.text) {
          return parsed.text;
        }
      } catch (e) {
        console.error("Error parsing JSON content:", e);
        // If JSON parsing fails, continue to return the original content
      }
    }

    // Return the content as is if it's not JSON or doesn't have a text field
    return content;
  };

  const handleCopyAsset = (asset: TechStackAsset) => {
    // Extract text content from JSON if needed
    const content = extractTextContent(asset.body);
    navigator.clipboard.writeText(content);
    toast({
      title: "Success",
      description: "Asset content copied to clipboard",
    });
  };

  const handleDownloadAsset = (asset: TechStackAsset) => {
    const blob = new Blob([asset.body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAssets = async () => {
    if (!selectedTechStack?.id) return;

    setIsDownloading(true);

    try {
      // Create a zip file with all assets
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add each asset to the zip
      assets.forEach((asset) => {
        const fileName = `${asset.title.replace(/\s+/g, "-").toLowerCase()}.md`;
        zip.file(fileName, asset.body);
      });

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });

      // Download the zip file
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTechStack.name.replace(/\s+/g, "-").toLowerCase()}-assets.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Assets downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download assets",
        variant: "destructive",
      });
      console.error("Error downloading assets:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    handleCreateAsset,
    handleEditAsset,
    handleSaveAsset,
    handleDeleteAsset,
    confirmDeleteAsset,
    handleGenerateContent,
    handleCopyAsset,
    handleDownloadAsset,
    handleDownloadAssets,
    isDownloading,
    setIsDownloading,
  };
}
