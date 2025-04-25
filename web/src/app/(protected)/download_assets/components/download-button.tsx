"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Button } from "@/components/ui/button";
import { PackageOpen, AlertCircle, Download, Check } from "lucide-react";
import { selectedPromptsAtom } from "./prompts-column";
import { downloadAssets } from "../actions/download-assets";
import { selectedAssetsAtom } from "./assets-atoms";
import { useXp } from "@/xp/useXp";
import { toast as showToast } from "@/hooks/use-toast";

type ShowToastOptions = Parameters<typeof showToast>[0];

interface DownloadButtonProps {
  onShowToast: (options: ShowToastOptions) => void;
}

export function DownloadButton({ onShowToast }: DownloadButtonProps) {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPrompts] = useAtom(selectedPromptsAtom);
  const [selectedAssets] = useAtom(selectedAssetsAtom);
  const { awardXp } = useXp();
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");

  const handleDownload = async () => {
    if (!selectedProductId) {
      onShowToast({
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
    const numSelected = assetIds.length + selectedPrompts.length;

    if (numSelected === 0) {
      onShowToast({
        title: "No items selected",
        description:
          "Please select at least one asset or guideline to download",
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

      if (result.success && result.downloadUrl && result.fileName) {
        // Create a temporary link to trigger the download
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadStatus("success");

        // Determine which XP action based on number of items
        const actionId =
          numSelected > 1 ? "download_multiple_assets" : "download_asset";
        // Get points from schedule (assuming 5 for single, 10 for multiple based on /qa route)
        const pointsAwarded = numSelected > 1 ? 10 : 5;
        let toastDescription = `Download successful (${result.fileName}).`;

        try {
          await awardXp(actionId);
          toastDescription += ` You earned ${pointsAwarded} XP!`;
        } catch (xpError) {
          console.error(
            `Failed to initiate XP award for ${actionId}:`,
            xpError
          );
        }

        onShowToast({
          title: "Download Complete",
          description: toastDescription,
          duration: 5000,
        });

        // Reset status after a delay
        setTimeout(() => setDownloadStatus("idle"), 3000);
      } else {
        throw new Error(
          result.error || "Download failed: URL or filename missing"
        );
      }
    } catch (error) {
      console.error("Error downloading assets:", error);
      setDownloadStatus("error");
      onShowToast({
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
