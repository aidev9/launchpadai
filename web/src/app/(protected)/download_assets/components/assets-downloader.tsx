"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileDown,
  PackageOpen,
  AlertCircle,
  Download,
  Check,
} from "lucide-react";

// Sample assets for demonstration
const assetCategories = [
  {
    id: "planning",
    name: "Planning Documents",
    description: "Business plans and strategic documents",
    assets: [
      { id: "1", name: "Business Plan.md", size: "45 KB" },
      { id: "2", name: "Executive Summary.md", size: "12 KB" },
      { id: "3", name: "Market Analysis.md", size: "28 KB" },
      { id: "4", name: "SWOT Analysis.md", size: "18 KB" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing Materials",
    description: "Materials for marketing your product",
    assets: [
      { id: "5", name: "Marketing Strategy.md", size: "38 KB" },
      { id: "6", name: "Brand Guidelines.md", size: "22 KB" },
      { id: "7", name: "Content Strategy.md", size: "25 KB" },
      { id: "8", name: "Social Media Plan.md", size: "17 KB" },
    ],
  },
  {
    id: "finance",
    name: "Financial Documents",
    description: "Financial projections and models",
    assets: [
      { id: "9", name: "Financial Projections.md", size: "32 KB" },
      { id: "10", name: "Funding Strategy.md", size: "15 KB" },
      { id: "11", name: "Pricing Model.md", size: "13 KB" },
      { id: "12", name: "Cash Flow Analysis.md", size: "24 KB" },
    ],
  },
  {
    id: "product",
    name: "Product Development",
    description: "Documents related to your product",
    assets: [
      { id: "13", name: "Product Roadmap.md", size: "29 KB" },
      { id: "14", name: "Technical Specifications.md", size: "42 KB" },
      { id: "15", name: "MVP Requirements.md", size: "19 KB" },
      { id: "16", name: "Feature Prioritization.md", size: "16 KB" },
    ],
  },
];

export function AssetsDownloader() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [activeCategory, setActiveCategory] = useState(assetCategories[0].id);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>(
    {}
  );
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");

  const currentCategory = assetCategories.find((c) => c.id === activeCategory);

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  const toggleAllInCategory = () => {
    if (!currentCategory) return;

    const allSelected = currentCategory.assets.every(
      (asset) => selectedAssets[asset.id]
    );

    const updatedSelection = { ...selectedAssets };
    currentCategory.assets.forEach((asset) => {
      updatedSelection[asset.id] = !allSelected;
    });

    setSelectedAssets(updatedSelection);
  };

  const countSelectedInCategory = (categoryId: string) => {
    const category = assetCategories.find((c) => c.id === categoryId);
    if (!category) return 0;

    return category.assets.filter((asset) => selectedAssets[asset.id]).length;
  };

  const handleDownload = async () => {
    if (!selectedProductId) return;

    setDownloadStatus("downloading");

    try {
      // In a real implementation, this would call an API to generate and download files
      // For now, we'll just simulate a download delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Set success state temporarily
      setDownloadStatus("success");
      setTimeout(() => setDownloadStatus("idle"), 3000);
    } catch (error) {
      console.error("Error downloading assets:", error);
      setDownloadStatus("error");
      setTimeout(() => setDownloadStatus("idle"), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generated Assets</CardTitle>
          <CardDescription>
            Select the assets you want to download. You can download individual
            files or all files in a category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4">
              {assetCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative"
                >
                  {category.name}
                  {countSelectedInCategory(category.id) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {countSelectedInCategory(category.id)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {assetCategories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllInCategory}
                    >
                      {category.assets.every(
                        (asset) => selectedAssets[asset.id]
                      )
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.assets.map((asset) => (
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
                            {asset.name}
                          </Label>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.size}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {Object.values(selectedAssets).filter(Boolean).length} assets
            selected
          </p>
        </div>
        <Button
          onClick={handleDownload}
          disabled={
            downloadStatus !== "idle" ||
            Object.values(selectedAssets).filter(Boolean).length === 0
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
    </div>
  );
}
