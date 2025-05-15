"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TechStackAsset } from "@/lib/firebase/schema";
import { RefreshCw, Copy, FileDown, Pencil, Trash } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/hooks/use-toast";

// Import Jotai atoms
import {
  selectedAssetAtom,
  selectedTechStackAtom,
  assetGeneratingAtom,
  generatingAssetsAtom,
  hasInsufficientCreditsAtom,
  techStackAssetsAtom,
} from "@/lib/store/techstack-store";

// Import React Server Actions
import {
  generateAssetContentAction,
  updateAssetAction,
  deleteAssetAction,
} from "../actions";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { set } from "nprogress";

export function AssetEditor() {
  // Use Jotai atoms directly instead of props
  // const [setAssets, assets] = useAtom(techStackAssetsAtom);
  const [assets, setAssets] = useAtom(techStackAssetsAtom);
  const [selectedAsset, setSelectedAsset] = useAtom(selectedAssetAtom);
  const [selectedTechStack] = useAtom(selectedTechStackAtom);
  const [isGenerating, setIsGenerating] = useAtom(assetGeneratingAtom);
  const [generatingAssets, setGeneratingAssets] = useAtom(generatingAssetsAtom);
  const [hasInsufficientCredits, setHasInsufficientCredits] = useAtom(
    hasInsufficientCreditsAtom
  );
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);

  // Local state
  const [userInstructions, setUserInstructions] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const { toast } = useToast();

  // Reset insufficient credits state when selected asset changes
  useEffect(() => {
    setHasInsufficientCredits(false);
    setShowSuccessAnimation(false);
    setEditorKey((prev) => prev + 1); // Force re-render of MDEditor
  }, [selectedAsset?.id, selectedAsset?.updatedAt, setHasInsufficientCredits]);

  // Handle the success animation timing
  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 5000); // 5 seconds for more visibility

      return () => clearTimeout(timer);
    }
  }, [showSuccessAnimation]);

  // Log when selectedAsset changes
  useEffect(() => {}, [selectedAsset]);

  // Handle generate content
  const handleGenerateContent = async () => {
    if (!selectedAsset || !selectedTechStack) return;

    // Reset any previous insufficient credits error
    setHasInsufficientCredits(false);
    setShowSuccessAnimation(false); // Reset animation state

    try {
      // Set generating state
      setIsGenerating(true);
      setGeneratingAssets((prev) => ({
        ...prev,
        [selectedAsset.id || ""]: true,
      }));

      // Optimistically update the UI to show "Generating..." in the editor
      setSelectedAsset((prev) => {
        if (prev) {
          return {
            ...prev,
            isGenerating: true,
          };
        }
        return prev;
      });

      // Call the server action directly
      const result = await generateAssetContentAction(
        selectedTechStack.id || "",
        selectedAsset.id || "",
        selectedAsset.assetType,
        selectedTechStack,
        userInstructions
      );

      // Check for insufficient credits
      if (
        !result.success &&
        "needMoreCredits" in result &&
        result.needMoreCredits
      ) {
        setHasInsufficientCredits(true);
        throw {
          message: result.error || "Insufficient prompt credits",
          needMoreCredits: true,
        };
      }

      // If successful, update the asset in the local state immediately
      if (result.success) {
        // Get the content from the result using type assertion
        const resultContent = (result as any).body || (result as any).content;
        setSelectedAsset((prev) => {
          if (prev) {
            const updatedAsset = {
              ...prev,
              body: resultContent,
              updatedAt: getCurrentUnixTimestamp(),
              needsGeneration: false,
              isGenerating: false,
              recentlyCompleted: true,
            };
            return updatedAsset;
          }
          return prev;
        });

        // Now, update all assets in the local state
        setAssets((prev) => {
          const updatedAssets = prev.map((asset) => {
            if (asset.id === selectedAsset.id) {
              return {
                ...asset,
                body: resultContent,
                updatedAt: getCurrentUnixTimestamp(),
                needsGeneration: false,
                isGenerating: false,
                recentlyCompleted: true,
              };
            } else {
              return {
                ...asset,
                isGenerating: false,
                recentlyCompleted: false,
              };
            }
            return asset;
          });
          return updatedAssets;
        });

        // Update prompt credits
        if (promptCredits) {
          setPromptCredits({
            ...promptCredits,
            remainingCredits: promptCredits.remainingCredits - 1,
            totalUsedCredits: (promptCredits.totalUsedCredits || 0) + 1,
          });
        }

        // Ensure we have a proper string for the body
        let updatedBody = "";

        // TODO: This section is mostly garbage and needs to be cleaned up
        if (resultContent === undefined || resultContent === null) {
          updatedBody = "No content was generated. Please try again.";
        } else if (typeof resultContent === "string") {
          // Check for the problematic "[object Object]" string
          if (resultContent === "[object Object]") {
            updatedBody =
              "Content not available in proper format. Please regenerate.";
          } else {
            updatedBody = resultContent;
          }
        } else if (typeof resultContent === "object") {
          // Try to extract content from object properties
          if (resultContent.text && typeof resultContent.text === "string") {
            updatedBody = resultContent.text;
          } else if (
            resultContent.body &&
            typeof resultContent.body === "string"
          ) {
            updatedBody = resultContent.body;
          } else if (
            resultContent.content &&
            typeof resultContent.content === "string"
          ) {
            updatedBody = resultContent.content;
          } else {
            // If no text/body/content field, stringify the object
            try {
              updatedBody = JSON.stringify(resultContent, null, 2);
            } catch (e) {
              updatedBody = "Error processing content. Please regenerate.";
            }
          }
        } else {
          // Convert to string as a last resort
          const stringContent = String(resultContent);
          if (stringContent === "[object Object]") {
            updatedBody =
              "Content not available in proper format. Please regenerate.";
          } else {
            updatedBody = stringContent;
          }
        }

        // Update selectedAsset
        setSelectedAsset((prev) => {
          if (prev) {
            const updatedAsset = {
              ...prev,
              body: updatedBody,
              updatedAt: getCurrentUnixTimestamp(),
              needsGeneration: false,
              isGenerating: false,
              recentlyCompleted: true,
            };

            return updatedAsset;
          }
          return prev;
        });

        // Force re-render of MDEditor after successful generation
        setEditorKey((prev) => prev + 1);

        // Check if the content was actually updated (not an error message)
        const contentLower = (updatedBody || "").toLowerCase();

        const isErrorContent =
          contentLower.includes("timed out") ||
          contentLower.includes("error") ||
          contentLower.includes("failed");

        if (!isErrorContent) {
          // Force a small delay before showing the animation
          // This ensures the content is updated first
          setShowSuccessAnimation(true); // Show success animation
        }
      }
    } catch (error) {
      // Safely check if error is an object with needMoreCredits property
      if (
        typeof error === "object" &&
        error !== null &&
        "needMoreCredits" in error
      ) {
        setHasInsufficientCredits(true);
        return;
      }
    } finally {
      setIsGenerating(false);

      // Clear the generating state for this asset after a delay
      setGeneratingAssets((prev) => {
        const newState = { ...prev };
        if (selectedAsset?.id) {
          delete newState[selectedAsset.id];
        }
        return newState;
      });
    }
  };

  // Handle copy asset
  const handleCopyAsset = (asset: TechStackAsset) => {
    // Extract text content from JSON if needed
    const content = asset.body;
    navigator.clipboard.writeText(content);
    toast({
      title: "Success",
      description: "Asset content copied to clipboard",
    });
  };

  // Handle download asset
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

  // Handle edit asset
  const handleEditAsset = (asset: TechStackAsset) => {
    // This will be handled by the parent component's dialog
    // We just need to set the selected asset
    setSelectedAsset(asset);

    // Dispatch a custom event that the parent can listen for
    const event = new CustomEvent("editAsset", { detail: asset });
    document.dispatchEvent(event);
  };

  // Handle delete asset
  const handleDeleteAsset = (asset: TechStackAsset) => {
    // This will be handled by the parent component's dialog
    // We just need to set the selected asset and dispatch an event
    setSelectedAsset(asset);

    // Dispatch a custom event that the parent can listen for
    const event = new CustomEvent("deleteAsset", { detail: asset });
    document.dispatchEvent(event);
  };

  // No debug logging needed

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            {selectedAsset ? selectedAsset.title : "Select an asset"}
          </CardTitle>
          {selectedAsset && selectedAsset.tags && (
            <div className="flex flex-wrap gap-1">
              {selectedAsset.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || selectedAsset?.isGenerating}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isGenerating || selectedAsset?.isGenerating
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  {selectedAsset?.isGenerating
                    ? "Generating..."
                    : selectedAsset?.needsGeneration
                      ? "Generate Content"
                      : "Regenerate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAsset(selectedAsset)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadAsset(selectedAsset)}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditAsset(selectedAsset)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAsset(selectedAsset)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              {selectedAsset?.isGenerating ? (
                <div className="min-h-[400px] border rounded-md p-4 flex flex-col items-center justify-center">
                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <p className="text-center text-muted-foreground">
                    Generating content for {selectedAsset?.title}...
                    <br />
                    <span className="text-sm">This may take a minute</span>
                  </p>
                </div>
              ) : (
                <div data-color-mode="light" className="relative">
                  <MDEditor
                    key={`editor-${selectedAsset?.id}-${editorKey}`}
                    value={(() => {
                      const processedContent = selectedAsset?.body || "";
                      return processedContent;
                    })()}
                    preview="preview"
                    height={400}
                    previewOptions={{
                      rehypePlugins: [[rehypeSanitize]],
                    }}
                  />
                  {showSuccessAnimation && (
                    <div
                      className="absolute inset-0 border-4 border-green-500 rounded-md pointer-events-none animate-pulse z-10"
                      style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.6)" }}
                    />
                  )}
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">
                  Regeneration Instructions
                </h3>
                <Textarea
                  placeholder="Add specific instructions for regenerating this content..."
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These instructions will be used along with the tech stack
                  details when regenerating content.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-muted-foreground mb-4">
                Select an asset from the list or create a new one
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
