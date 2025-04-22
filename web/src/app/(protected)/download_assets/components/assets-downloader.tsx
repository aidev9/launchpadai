"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileDown,
  PackageOpen,
  AlertCircle,
  Download,
  Check,
} from "lucide-react";
import { PromptsColumn, selectedPromptsAtom } from "./prompts-column";
import { selectedPhasesAtom } from "./phase-toolbar";
import { getProductAssets } from "@/lib/firebase/assets";
import { downloadAssets } from "../actions/download-assets";
import { toast } from "@/components/ui/use-toast";

interface FirestoreAsset {
  id: string;
  phase: string;
  document: string;
  content?: string;
  createdAt?: string;
  last_modified?: string;
  systemPrompt?: string;
  order?: number;
}

export function AssetsDownloader() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPhases] = useAtom(selectedPhasesAtom);
  const [selectedPrompts] = useAtom(selectedPromptsAtom);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>(
    {}
  );
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
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
          setAllAssets(result.assets as FirestoreAsset[]);
        } else {
          toast({
            title: "Error loading assets",
            description: result.error || "Failed to load assets",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
        toast({
          title: "Error loading assets",
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

  const handleDownload = async () => {
    if (!selectedProductId) {
      toast({
        title: "No product selected",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    // Get selected asset IDs
    const assetIds = Object.entries(selectedAssets)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    if (assetIds.length === 0 && selectedPrompts.length === 0) {
      toast({
        title: "No assets selected",
        description: "Please select at least one asset or guideline",
        variant: "destructive",
      });
      return;
    }

    setDownloadStatus("downloading");

    try {
      // Call the server action
      const result = await downloadAssets({
        productId: selectedProductId,
        assetIds,
        promptIds: selectedPrompts,
      });

      if (result.success) {
        // Create a temporary link to trigger the download
        const link = document.createElement("a");
        link.href = result.downloadUrl!;
        link.download = result.fileName!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadStatus("success");
        setTimeout(() => setDownloadStatus("idle"), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error downloading assets:", error);
      setDownloadStatus("error");
      toast({
        title: "Download error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setTimeout(() => setDownloadStatus("idle"), 3000);
    }
  };

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
              <CardTitle>Generated Assets</CardTitle>
              <CardDescription>
                Select the assets you want to download.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Available Assets</h3>
                <Button variant="outline" size="sm" onClick={toggleAllAssets}>
                  {displayedAssets.every((asset) => selectedAssets[asset.id])
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-center p-4 text-muted-foreground">
                    Loading assets...
                  </div>
                ) : displayedAssets.length > 0 ? (
                  displayedAssets.map((asset) => (
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
                            {asset.document}
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                          {asset.phase}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {asset.last_modified
                            ? new Date(asset.last_modified).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No assets found for the selected filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {Object.values(selectedAssets).filter(Boolean).length} assets
                and {selectedPrompts.length} guidelines selected
              </p>
            </div>
            <Button
              onClick={handleDownload}
              disabled={
                downloadStatus !== "idle" ||
                (Object.values(selectedAssets).filter(Boolean).length === 0 &&
                  selectedPrompts.length === 0)
              }
              className="flex items-center gap-2"
            >
              {downloadStatus === "idle" && (
                <>
                  Download Selected <Download className="h-4 w-4" />
                </>
              )}
              {downloadStatus === "downloading" && (
                <>
                  Downloading...{" "}
                  <PackageOpen className="h-4 w-4 animate-pulse" />
                </>
              )}
              {downloadStatus === "success" && (
                <>
                  Downloaded Successfully <Check className="h-4 w-4" />
                </>
              )}
              {downloadStatus === "error" && (
                <>
                  Download Failed <AlertCircle className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
