"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle,
  FileEdit,
  FileText,
  Save,
  Wand2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { assets, getAssetsByPhase, Asset } from "../data/assets";
import {
  saveAsset,
  getProductAssets,
  getAsset as getFirestoreAsset,
} from "@/lib/firebase/assets";
import { toast } from "@/components/ui/use-toast";
import { generateAsset } from "../actions/generate-asset";
import { selectedPhasesAtom } from "./phase-toolbar";

// Extended Asset type that includes content from Firestore
interface FirestoreAsset extends Asset {
  content?: string;
  last_modified?: string; // ISO string for timestamp
  createdAt?: string; // ISO string for timestamp
}

export function AssetsReviewer() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPhases] = useAtom(selectedPhasesAtom);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [assetContent, setAssetContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [displayedAssets, setDisplayedAssets] = useState<Asset[]>([]);
  const [firestoreAssets, setFirestoreAssets] = useState<
    Record<string, FirestoreAsset>
  >({});

  // Filter assets based on selected phases
  useEffect(() => {
    if (selectedPhases.includes("All")) {
      setDisplayedAssets(assets);
    } else {
      const filteredAssets = assets.filter((asset) =>
        selectedPhases.includes(asset.phase)
      );
      setDisplayedAssets(filteredAssets);
    }

    // Clear selection when phases change
    setSelectedAssetId("");
    setAssetContent("");
  }, [selectedPhases]);

  // Load Firestore assets when product changes
  useEffect(() => {
    async function loadFirestoreAssets() {
      if (!selectedProductId) return;

      setIsLoading(true);
      try {
        const response = await getProductAssets(selectedProductId);
        if (response.success && response.assets) {
          // Create a map of asset ID to asset data
          const assetMap: Record<string, FirestoreAsset> = {};
          response.assets.forEach((asset) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });
          setFirestoreAssets(assetMap);
        }
      } catch (error) {
        console.error("Error loading Firestore assets:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFirestoreAssets();
  }, [selectedProductId]);

  // Load asset content when selected
  useEffect(() => {
    async function loadAssetContent() {
      if (!selectedAssetId || !selectedProductId) {
        setAssetContent("");
        return;
      }

      setIsLoading(true);

      try {
        // Check if we have the asset in Firestore
        if (selectedAssetId in firestoreAssets) {
          // Use content from Firestore
          setAssetContent(
            firestoreAssets[selectedAssetId].content || "# No content available"
          );
        } else {
          // Attempt to load from Firestore directly
          const response = await getFirestoreAsset(
            selectedProductId,
            selectedAssetId
          );
          if (
            response.success &&
            response.asset &&
            "content" in response.asset
          ) {
            setAssetContent(response.asset.content as string);
          } else {
            // If not in Firestore, show placeholder
            setAssetContent(
              "# Content will be generated or loaded from storage"
            );
          }
        }
      } catch (error) {
        console.error("Error loading asset content:", error);
        setAssetContent("# Error loading content");
      } finally {
        setIsLoading(false);
      }

      setIsEditing(false);
      setSaveStatus("idle");
    }

    loadAssetContent();
  }, [selectedAssetId, selectedProductId, firestoreAssets]);

  const handleSave = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // Get the selected asset
      const selectedAsset = assets.find((a) => a.id === selectedAssetId);
      if (!selectedAsset) {
        throw new Error("Asset not found");
      }

      // Call the server action to save the asset
      const response = await saveAsset(selectedProductId, {
        id: selectedAssetId,
        phase: selectedAsset.phase,
        document: selectedAsset.document,
        systemPrompt: selectedAsset.systemPrompt,
        order: selectedAsset.order,
        content: assetContent,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to save asset");
      }

      // Update local Firestore assets cache
      setFirestoreAssets((prev) => ({
        ...prev,
        [selectedAssetId]: {
          ...prev[selectedAssetId],
          content: assetContent,
          id: selectedAssetId,
          phase: selectedAsset.phase,
          document: selectedAsset.document,
          systemPrompt: selectedAsset.systemPrompt,
          order: selectedAsset.order,
        },
      }));

      setSaveStatus("success");
      toast({
        title: "Asset saved",
        description: "Your asset has been saved successfully.",
      });

      setTimeout(() => setSaveStatus("idle"), 2000);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving asset:", error);
      setSaveStatus("error");
      toast({
        title: "Error saving asset",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    setIsGenerating(true);

    try {
      // Call the real server action to generate the asset
      const response = await generateAsset({
        productId: selectedProductId,
        assetId: selectedAssetId,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to generate asset");
      }

      // Update the content with the generated content
      setAssetContent(response.content || "");

      // Update local Firestore assets cache
      const selectedAsset = assets.find((a) => a.id === selectedAssetId);
      if (selectedAsset) {
        setFirestoreAssets((prev) => ({
          ...prev,
          [selectedAssetId]: {
            ...prev[selectedAssetId],
            content: response.content,
            id: selectedAssetId,
            phase: selectedAsset.phase,
            document: selectedAsset.document,
            systemPrompt: selectedAsset.systemPrompt,
            order: selectedAsset.order,
          },
        }));
      }

      toast({
        title: "Asset generated",
        description: "Your asset has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating asset:", error);
      toast({
        title: "Error generating asset",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to check if an asset exists in Firestore
  const assetExistsInFirestore = (assetId: string) => {
    return assetId in firestoreAssets;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Asset list - Left column */}
      <Card className="md:col-span-1 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Assets</h3>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4 space-y-2">
            {displayedAssets.map((asset) => (
              <Button
                key={asset.id}
                variant={selectedAssetId === asset.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => setSelectedAssetId(asset.id)}
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{asset.document}</span>
                {assetExistsInFirestore(asset.id) && (
                  <span
                    className="ml-auto bg-green-500 w-2 h-2 rounded-full"
                    title="Saved in Firestore"
                  ></span>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Asset content - Right column */}
      <Card className="md:col-span-3">
        {selectedAssetId ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">
                {assets.find((a) => a.id === selectedAssetId)?.document ||
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
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      Edit <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {isGenerating ? "Generating..." : "Generate"}{" "}
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[calc(100vh-280px)]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : isEditing ? (
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
              Choose an asset from the list to view its contents. You can edit,
              generate, and save changes.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
