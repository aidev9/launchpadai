"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAtom } from "jotai";
import { selectedFeatureAtom } from "@/lib/store/feature-store";
import { useState } from "react";
import { generatePrd } from "@/lib/ai/feature-prd";
import { useToast } from "@/hooks/use-toast";

export function PrdDownload() {
  const [feature] = useAtom(selectedFeatureAtom);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!feature) return;

    setIsGenerating(true);

    try {
      // Use stored PRD content if available, otherwise generate a new one
      let prdContent = "";

      if (feature.prdContent) {
        prdContent = feature.prdContent;
      } else {
        // Generate PRD content
        const result = await generatePrd(feature);

        if (!result.success) {
          throw new Error(result.error || "Failed to generate PRD");
        }

        prdContent = result.prdContent || "";
      }

      // Create a blob and download
      const blob = new Blob([prdContent], {
        type: "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${feature.name.replace(/\s+/g, "-").toLowerCase()}-prd.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PRD downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate PRD",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={!feature || isGenerating}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Download PRD"}
    </Button>
  );
}
