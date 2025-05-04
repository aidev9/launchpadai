import { useState, Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import {
  createTechStackAsset,
  updateTechStackAsset,
  deleteTechStackAsset,
  generateAssetContent,
  getTechStackAssets,
} from "@/lib/firebase/techstack-assets";

export function useAssetHandlers(
  selectedTechStack: TechStack | null,
  assets: TechStackAsset[],
  setAssets: React.Dispatch<React.SetStateAction<TechStackAsset[]>>,
  selectedAsset: TechStackAsset | null,
  setSelectedAsset: React.Dispatch<React.SetStateAction<TechStackAsset | null>>,
  setIsAssetDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isGeneratingContent: boolean,
  setIsGeneratingContent: React.Dispatch<React.SetStateAction<boolean>>,
  generatingAssets: Record<string, boolean>,
  setGeneratingAssets: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >
) {
  const { toast } = useToast();

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
        toast({
          title: "Success",
          description: selectedAsset
            ? "Asset updated successfully"
            : "Asset created successfully",
        });

        // Refresh assets
        const assetsResult = await getTechStackAssets(selectedTechStack.id);
        if (assetsResult.success && assetsResult.assets) {
          setAssets(assetsResult.assets);
        }

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

  const handleDeleteAsset = async (asset: TechStackAsset) => {
    if (!selectedTechStack?.id || !asset.id) return;

    try {
      const result = await deleteTechStackAsset(selectedTechStack.id, asset.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Asset deleted successfully",
        });

        // Remove asset from state
        setAssets((prev: TechStackAsset[]) =>
          prev.filter((a: TechStackAsset) => a.id !== asset.id)
        );

        // Clear selected asset if it was deleted
        if (selectedAsset?.id === asset.id) {
          setSelectedAsset(null);
        }
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

    setIsGeneratingContent(true);

    // Mark this asset as generating
    setAssets((prev: TechStackAsset[]) =>
      prev.map((a: TechStackAsset) =>
        a.id === asset.id ? { ...a, isGenerating: true } : a
      )
    );

    // Update the generating assets tracking
    setGeneratingAssets((prev: Record<string, boolean>) => ({
      ...prev,
      [asset.id!]: true,
    }));

    try {
      toast({
        title: "Generating Content",
        description: `Regenerating content for ${asset.title}. This may take a minute...`,
      });

      const result = await generateAssetContent(
        selectedTechStack.id,
        asset.id,
        asset.assetType,
        selectedTechStack,
        userInstructions
      );

      // Use the extractTextContent function defined below

      // Process the content to extract text if it's in JSON format
      const processedContent = result.success
        ? extractTextContent(result.body || result.content || "")
        : "";

      if (result.success) {
        // Immediately update the selected asset with the new content
        // This makes the Regenerate button work immediately without waiting for polling
        if (selectedAsset && asset.id === selectedAsset.id) {
          setSelectedAsset({
            ...selectedAsset,
            body: processedContent || selectedAsset.body,
            isGenerating: false,
          });
        }

        // Update the assets state to reflect the new content
        setAssets((prev: TechStackAsset[]) =>
          prev.map((a: TechStackAsset) =>
            a.id === asset.id
              ? {
                  ...a,
                  body: processedContent || a.body,
                  isGenerating: false,
                }
              : a
          )
        );

        // Also update the generating assets tracking
        setGeneratingAssets((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          if (asset.id) delete updated[asset.id];
          return updated;
        });

        // Refresh assets to get the updated state from the server
        const assetsResult = await getTechStackAssets(selectedTechStack.id);
        if (assetsResult.success && assetsResult.assets) {
          setAssets(assetsResult.assets);

          // Update the selected asset if it's in the updated assets
          if (selectedAsset) {
            const updatedSelectedAsset = assetsResult.assets.find(
              (a) => a.id === selectedAsset.id
            );
            if (updatedSelectedAsset) {
              setSelectedAsset(updatedSelectedAsset);
            }
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate content",
          variant: "destructive",
        });

        // Reset the generating state for this asset
        setAssets((prev: TechStackAsset[]) =>
          prev.map((a: TechStackAsset) =>
            a.id === asset.id ? { ...a, isGenerating: false } : a
          )
        );

        // Remove from generating assets tracking
        setGeneratingAssets((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          if (asset.id) delete updated[asset.id];
          return updated;
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

      // Reset the generating state for this asset
      setAssets((prev: TechStackAsset[]) =>
        prev.map((a: TechStackAsset) =>
          a.id === asset.id ? { ...a, isGenerating: false } : a
        )
      );

      // Remove from generating assets tracking
      setGeneratingAssets((prev: Record<string, boolean>) => {
        const updated = { ...prev };
        if (asset.id) delete updated[asset.id];
        return updated;
      });
    } finally {
      setIsGeneratingContent(false);
    }
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

  return {
    handleCreateAsset,
    handleEditAsset,
    handleSaveAsset,
    handleDeleteAsset,
    handleGenerateContent,
    handleCopyAsset,
    handleDownloadAsset,
  };
}
