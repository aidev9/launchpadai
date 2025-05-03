"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown } from "lucide-react";
import { PromptsColumn } from "./prompts-column";
import { selectedPhasesAtom } from "./phase-toolbar";
import { getProductAssets } from "@/lib/firebase/assets";
import { toast } from "@/components/ui/use-toast";
import { selectedAssetsAtom } from "./assets-atoms";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface FirestoreAsset {
  id: string;
  phase: string;
  document: string;
  content?: string;
  title?: string;
  createdAt?: string;
  last_modified?: string;
  systemPrompt?: string;
  order?: number;
}

export function AssetsDownloader() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPhases] = useAtom(selectedPhasesAtom);
  // const [selectedPrompts] = useAtom(selectedPromptsAtom);
  const [selectedAssets, setSelectedAssets] = useAtom(selectedAssetsAtom);
  const [displayedAssets, setDisplayedAssets] = useState<FirestoreAsset[]>([]);
  const [allAssets, setAllAssets] = useState<FirestoreAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch assets from Firebase
  useEffect(() => {
    async function fetchAssets() {
      if (!selectedProductId) return;

      setIsLoading(true);
      try {
        const result = await getProductAssets(selectedProductId);
        if (result.success && result.assets) {
          // Log the assets for debugging
          setAllAssets(result.assets as FirestoreAsset[]);
        } else {
          toast({
            title: "Error loading assets",
            duration: TOAST_DEFAULT_DURATION,
            description: result.error || "Failed to load assets",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
        toast({
          title: "Error loading assets",
          duration: TOAST_DEFAULT_DURATION,
          description: "Failed to load assets from server",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, [selectedProductId]);

  // Filter assets based on selected phases
  useEffect(() => {
    if (selectedPhases.includes("All")) {
      setDisplayedAssets(allAssets);
    } else {
      const filteredAssets = allAssets.filter((asset) =>
        selectedPhases.includes(asset.phase)
      );
      setDisplayedAssets(filteredAssets);
    }
  }, [selectedPhases, allAssets]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  const toggleAllAssets = () => {
    const allSelected = displayedAssets.every(
      (asset) => selectedAssets[asset.id]
    );

    const updatedSelection = { ...selectedAssets };
    displayedAssets.forEach((asset) => {
      updatedSelection[asset.id] = !allSelected;
    });

    setSelectedAssets(updatedSelection);
  };

  // Get asset title for display
  const getAssetTitle = (asset: FirestoreAsset) => {
    // Try different possible title fields in order of preference
    if (asset.title) return asset.title;
    if (asset.document) return asset.document;

    // If content exists and is not too long, it might be a title
    if (asset.content && asset.content.length < 100) {
      return asset.content;
    }

    // If content exists but is long, try to extract a title from it
    if (asset.content) {
      // Try to get the first line or first sentence
      const firstLine = asset.content.split("\n")[0]?.trim();
      if (firstLine && firstLine.length < 100) return firstLine;

      const firstSentence = asset.content.split(".")[0]?.trim();
      if (firstSentence && firstSentence.length < 100) return firstSentence;
    }

    // Fallback to asset ID
    return `Untitled Asset (${asset.id.substring(0, 6)})`;
  };

  const areAllSelected =
    displayedAssets.length > 0 &&
    displayedAssets.every((asset) => selectedAssets[asset.id]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-6">
        {/* Left Column - Prompts */}
        <div className="w-1/4">
          <PromptsColumn />
        </div>

        {/* Right Column - Assets */}
        <div className="w-3/4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Available Assets</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-center p-4 text-muted-foreground">
                    Loading assets...
                  </div>
                ) : displayedAssets.length > 0 ? (
                  <>
                    {/* Select All checkbox */}
                    <div className="flex items-center gap-3 pl-4 bg-muted/20">
                      <Checkbox
                        id="select-all"
                        checked={areAllSelected}
                        onCheckedChange={toggleAllAssets}
                      />
                      <Label
                        htmlFor="select-all"
                        className="font-bold cursor-pointer"
                      >
                        Select All
                      </Label>
                    </div>

                    {/* Asset list */}
                    {displayedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`asset-${asset.id}`}
                            checked={selectedAssets[asset.id] || false}
                            onCheckedChange={() => toggleAsset(asset.id)}
                          />
                          <div className="flex items-center gap-2">
                            <FileDown className="h-5 w-5 text-muted-foreground" />
                            <Label
                              htmlFor={`asset-${asset.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {getAssetTitle(asset)}
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                            {asset.phase}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {asset.last_modified
                              ? new Date(
                                  asset.last_modified
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No assets found for the selected filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
