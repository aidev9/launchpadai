"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Button } from "@/components/ui/button";
import { PackageOpen, AlertCircle, Download, Check } from "lucide-react";
import { selectedPromptsAtom } from "./prompts-column";
import { downloadAssets } from "../actions/download-assets";
import { selectedAssetsAtom } from "./assets-atoms";
import { useXpMutation } from "@/xp/useXpMutation";
import { toast as showToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

type ShowToastOptions = Parameters<typeof showToast>[0];

interface DownloadButtonProps {
  onShowToast: (options: ShowToastOptions) => void;
}

export function DownloadButton({ onShowToast }: DownloadButtonProps) {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedAssets] = useAtom(selectedAssetsAtom);
  const [selectedPrompts] = useAtom(selectedPromptsAtom);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  const handleDownload = async () => {
    if (!selectedProduct?.id) {
      onShowToast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
      });
      return;
    }

    const assetIds = Object.keys(selectedAssets).filter(
      (id) => selectedAssets[id]
    );
    const numSelected = assetIds.length + selectedPrompts.length;

    if (numSelected === 0) {
      onShowToast({
        title: "No items selected",
        description: "Please select assets or prompts to download",
        variant: "destructive",
      });
      return;
    }

    setDownloadStatus("loading");

    try {
      // Call the server action
      const result = await downloadAssets({
        productId: selectedProduct?.id,
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

        // Fire XP award in background without waiting
        xpMutation.mutate(actionId);

        // Show success toast immediately
        onShowToast({
          title: "Download Complete",
          description: `Download successful (${result.fileName}). You earned ${pointsAwarded} XP!`,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Reset status after a delay without setTimeout
        // Using requestAnimationFrame for smoother UI transition
        requestAnimationFrame(() => {
          // Add a small delay before resetting status
          setTimeout(() => setDownloadStatus("idle"), 2000);
        });
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

      // Reset status using requestAnimationFrame instead of setTimeout
      requestAnimationFrame(() => {
        setTimeout(() => setDownloadStatus("idle"), 2000);
      });
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
        {downloadStatus === "loading" && (
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
