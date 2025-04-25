"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Button } from "@/components/ui/button";
import { PackageOpen, AlertCircle, Download, Check } from "lucide-react";
import { selectedPromptsAtom } from "./prompts-column";
import { downloadAssets } from "../actions/download-assets";
import { toast } from "@/components/ui/use-toast";
import { selectedAssetsAtom } from "./assets-atoms";
import { useXp } from "@/xp/useXp";

export function DownloadButton() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPrompts] = useAtom(selectedPromptsAtom);
  const [selectedAssets] = useAtom(selectedAssetsAtom);
  const { refreshXp } = useXp();
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");

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

        // Refresh XP after successful download
        console.log("Assets downloaded, refreshing XP...");
        refreshXp().catch((err) =>
          console.error("Failed to refresh XP after downloading assets:", err)
        );

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
    <div className="flex items-center gap-2">
      <p className="text-sm text-muted-foreground mr-2">
        {Object.values(selectedAssets).filter(Boolean).length} assets and{" "}
        {selectedPrompts.length} guidelines selected
      </p>
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
            Downloading... <PackageOpen className="h-4 w-4 animate-pulse" />
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
  );
}
