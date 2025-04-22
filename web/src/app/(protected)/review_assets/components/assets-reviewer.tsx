"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  FileEdit,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Sample assets for demonstration
const sampleAssets = [
  { id: "1", name: "Business Plan.md", category: "Planning" },
  { id: "2", name: "Pitch Deck.md", category: "Presentation" },
  { id: "3", name: "Executive Summary.md", category: "Planning" },
  { id: "4", name: "Market Analysis.md", category: "Research" },
  { id: "5", name: "Competitive Analysis.md", category: "Research" },
  { id: "6", name: "Financial Projections.md", category: "Finance" },
  { id: "7", name: "Marketing Strategy.md", category: "Marketing" },
  { id: "8", name: "Product Roadmap.md", category: "Development" },
  { id: "9", name: "User Personas.md", category: "Customer" },
  { id: "10", name: "Customer Acquisition Plan.md", category: "Marketing" },
];

// Sample content for demonstration
const getAssetContent = (assetId: string) => {
  const contents: Record<string, string> = {
    "1": `# Business Plan\n\n## Executive Summary\nOur company provides innovative software solutions to help startups streamline their operations...\n\n## Business Model\n...\n\n## Go-to-Market Strategy\n...\n\n## Financial Projections\n...`,
    "2": `# Pitch Deck\n\n## Problem\nStartups struggle with organizing their business assets and tracking their progress...\n\n## Solution\nOur platform provides a centralized location for all business documents and planning tools...\n\n## Market Size\n...\n\n## Business Model\n...`,
    "3": `# Executive Summary\n\nOur company is building a revolutionary platform to help startups organize and track their business documents...\n\n## Problem Statement\n...\n\n## Solution Overview\n...\n\n## Target Market\n...`,
    "4": `# Market Analysis\n\n## Industry Overview\nThe business management software industry is growing at 12% annually...\n\n## Target Market\n...\n\n## Market Size\n...\n\n## Market Trends\n...`,
    "5": `# Competitive Analysis\n\n## Direct Competitors\n- Competitor A: Offers similar features but lacks integration\n- Competitor B: Well-established but expensive\n\n## Indirect Competitors\n...\n\n## Competitive Advantages\n...`,
    "6": `# Financial Projections\n\n## Revenue Forecast\nYear 1: $100,000\nYear 2: $500,000\nYear 3: $1,200,000\n\n## Expense Projections\n...\n\n## Break-even Analysis\n...`,
    "7": `# Marketing Strategy\n\n## Target Audience\nOur primary target audience consists of tech startup founders and small business owners...\n\n## Channels\n...\n\n## Messaging\n...\n\n## Budget Allocation\n...`,
    "8": `# Product Roadmap\n\n## Phase 1 (Q1-Q2 2023)\n- Feature A: Document management\n- Feature B: User authentication\n\n## Phase 2 (Q3-Q4 2023)\n...\n\n## Phase 3 (Q1-Q2 2024)\n...`,
    "9": `# User Personas\n\n## Persona 1: Startup Founder Sara\nAge: 28-35\nBackground: Tech industry\nGoals: Grow her business efficiently\nPain points: Too many tools, disorganized documents\n\n## Persona 2: Small Business Owner Michael\n...`,
    "10": `# Customer Acquisition Plan\n\n## Acquisition Channels\n1. Content Marketing\n2. Social Media\n3. Search Engine Marketing\n\n## Customer Journey\n...\n\n## Conversion Funnel\n...\n\n## CAC Projections\n...`,
  };

  return contents[assetId] || "# Content not found";
};

// Group assets by category
const groupedAssets = sampleAssets.reduce<Record<string, typeof sampleAssets>>(
  (acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  },
  {}
);

export function AssetsReviewer() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [assetContent, setAssetContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [activeCategory, setActiveCategory] = useState<string>(
    Object.keys(groupedAssets)[0] || ""
  );

  // Load asset content when selected
  useEffect(() => {
    if (selectedAssetId) {
      const content = getAssetContent(selectedAssetId);
      setAssetContent(content);
    } else {
      setAssetContent("");
    }
    setIsEditing(false);
    setSaveStatus("idle");
  }, [selectedAssetId]);

  const handleSave = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // In a real implementation, save to Firestore
      // await saveAssetContent(selectedProductId, selectedAssetId, assetContent);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving asset:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Asset list - Right column */}
      <Card className="md:col-span-1 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Assets</h3>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start px-4 pt-4">
            {Object.keys(groupedAssets).map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedAssets).map(([category, assets]) => (
            <TabsContent key={category} value={category} className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 space-y-2">
                  {assets.map((asset) => (
                    <Button
                      key={asset.id}
                      variant={
                        selectedAssetId === asset.id ? "secondary" : "ghost"
                      }
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{asset.name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Asset content - Left column */}
      <Card className="md:col-span-3">
        {selectedAssetId ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">
                {sampleAssets.find((a) => a.id === selectedAssetId)?.name ||
                  "Selected Asset"}
              </h3>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {saveStatus === "saving" && "Saving..."}
                    {saveStatus === "success" && (
                      <>
                        Saved <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                    {saveStatus === "error" && (
                      <>
                        Error <AlertCircle className="h-4 w-4" />
                      </>
                    )}
                    {saveStatus === "idle" && (
                      <>
                        Save <Save className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    Edit <FileEdit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-4">
              {isEditing ? (
                <Textarea
                  value={assetContent}
                  onChange={(e) => setAssetContent(e.target.value)}
                  className="font-mono text-sm min-h-[calc(100vh-280px)]"
                />
              ) : (
                <div className="prose max-w-none dark:prose-invert overflow-auto h-[calc(100vh-280px)] p-2">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {assetContent}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-280px)]">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Select an Asset</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Choose an asset from the list to view its contents. You can edit
              and save changes.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
