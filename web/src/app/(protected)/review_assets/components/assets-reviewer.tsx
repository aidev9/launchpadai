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
  StickyNote,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { assets, getAssetsByPhase, Asset } from "../data/assets";
import { toast } from "@/components/ui/use-toast";
import { selectedPhasesAtom } from "./phase-toolbar";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "react-error-boundary";
import { newlyCreatedAssetIdAtom } from "./add-asset-button";

// Interface definitions
interface Note {
  id: string;
  note_body: string;
  last_modified: string;
}

interface FirestoreAsset extends Asset {
  content?: string;
  last_modified?: string;
  createdAt?: string;
}

// Loading skeleton component
function AssetsReviewerSkeleton() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
            ></div>
          ))}
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
        Something went wrong loading the assets reviewer
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-4">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Try again
      </button>
    </div>
  );
}

// Main component
function AssetsReviewerContent() {
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
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [newlyCreatedAssetId, setNewlyCreatedAssetId] = useAtom(
    newlyCreatedAssetIdAtom
  );

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
        // Dynamically import server action to avoid bundling server code
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProductId);

        if (response.success && response.assets) {
          // Create a map of asset ID to asset data
          const assetMap: Record<string, FirestoreAsset> = {};
          response.assets.forEach((asset: any) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });
          setFirestoreAssets(assetMap);
        }

        // Load notes using server action
        const { getProjectNotesAction } = await import(
          "../actions/get-project-notes-action"
        );
        const notesResponse = await getProjectNotesAction(selectedProductId);

        if (notesResponse.success && notesResponse.notes) {
          setNotes(notesResponse.notes as Note[]);
        }
      } catch (error) {
        console.error("Error loading Firestore assets:", error);
        toast({
          title: "Error loading assets",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
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
          // Attempt to load from Firestore using server action
          const { getAssetAction } = await import(
            "../actions/get-asset-action"
          );
          const response = await getAssetAction(
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
        toast({
          title: "Error loading content",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }

      setIsEditing(false);
      setSaveStatus("idle");
    }

    loadAssetContent();
  }, [selectedAssetId, selectedProductId, firestoreAssets]);

  // Listen for newly created assets
  useEffect(() => {
    if (newlyCreatedAssetId) {
      // Refresh asset list from Firestore
      const refreshAssets = async () => {
        if (!selectedProductId) return;

        try {
          // Dynamically import server action
          const { getProductAssetsAction } = await import(
            "../actions/get-product-assets-action"
          );
          const response = await getProductAssetsAction(selectedProductId);

          if (response.success && response.assets) {
            // Create a map of asset ID to asset data
            const assetMap: Record<string, FirestoreAsset> = {};
            response.assets.forEach((asset: any) => {
              assetMap[asset.id] = asset as FirestoreAsset;
            });

            // Update Firestore assets
            setFirestoreAssets(assetMap);

            // Find the newly created asset
            const createdAsset = response.assets.find(
              (asset: any) => asset.id === newlyCreatedAssetId
            );

            // If we found the asset, update displayed assets if needed
            if (createdAsset) {
              // Determine if we should add it based on selected phases
              const phase = createdAsset.phase || "Discover"; // Default to Discover if missing

              if (
                selectedPhases.includes("All") ||
                selectedPhases.includes(phase)
              ) {
                // Create a temporary array to check for duplicates
                const tempAssets = [...displayedAssets];
                const assetExists = tempAssets.some(
                  (asset) => asset.id === newlyCreatedAssetId
                );

                // Only add if it doesn't exist
                if (!assetExists) {
                  tempAssets.push({
                    id: createdAsset.id,
                    document: createdAsset.document,
                    phase: phase,
                    systemPrompt: createdAsset.systemPrompt || "",
                    order: createdAsset.order || 999,
                  });

                  setDisplayedAssets(tempAssets);
                }
              }
            }

            // Select the newly created asset
            setSelectedAssetId(newlyCreatedAssetId);

            // Reset the newly created asset ID atom
            setNewlyCreatedAssetId(null);
          }
        } catch (error) {
          console.error("Error refreshing assets:", error);
        }
      };

      refreshAssets();
    }
  }, [
    newlyCreatedAssetId,
    selectedProductId,
    setNewlyCreatedAssetId,
    selectedPhases,
    displayedAssets,
  ]);

  const handleSave = async () => {
    if (!selectedAssetId || !selectedProductId || !assetContent) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // Get metadata for this asset
      const selectedAsset = assets.find((a) => a.id === selectedAssetId);
      if (!selectedAsset) {
        throw new Error("Asset metadata not found");
      }

      // Use server action
      const { saveAssetAction } = await import("../actions/asset-actions");
      const response = await saveAssetAction({
        productId: selectedProductId,
        asset: {
          id: selectedAssetId,
          phase: selectedAsset.phase,
          document: selectedAsset.document,
          systemPrompt: selectedAsset.systemPrompt,
          order: selectedAsset.order,
          content: assetContent,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Update local state
      setFirestoreAssets((prev) => ({
        ...prev,
        [selectedAssetId]: {
          ...selectedAsset,
          content: assetContent,
          last_modified: new Date().toISOString(),
        },
      }));

      setSaveStatus("success");
      toast({
        title: "Asset saved",
        description: "Your changes have been saved successfully.",
      });

      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving asset:", error);
      setSaveStatus("error");
      toast({
        title: "Error saving asset",
        description: error instanceof Error ? error.message : String(error),
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
      // Use server action
      const { generateAsset } = await import("../actions/generate-asset");
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
            ...selectedAsset,
            content: response.content || "",
            last_modified: new Date().toISOString(),
          },
        }));
      }

      toast({
        title: "Content generated",
        description: "Your asset content has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating asset:", error);
      toast({
        title: "Error generating content",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if an asset exists in our Firestore cache
  const assetExistsInFirestore = (assetId: string) => {
    return assetId in firestoreAssets && !!firestoreAssets[assetId].content;
  };

  const handleSaveNote = async () => {
    if (!selectedProductId || !noteContent) return;

    setIsSavingNote(true);

    try {
      // Use server action
      const { saveNoteAction } = await import("../actions/notes-actions");
      const response = await saveNoteAction({
        productId: selectedProductId,
        note: {
          id: uuidv4(),
          note_body: noteContent,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Update local state
      if (response.note) {
        // Convert the Date object to a string if needed
        const newNote = {
          ...response.note,
          last_modified:
            typeof response.note.last_modified === "object"
              ? response.note.last_modified.toISOString()
              : response.note.last_modified,
        } as Note;

        setNotes((prev) => [...prev, newNote]);
      }

      // Close dialog and clear content
      setNoteDialogOpen(false);
      setNoteContent("");

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error saving note",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(false);
    }
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
                    className="flex items-center gap-1 bg-black text-white hover:bg-black/90"
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
                      onClick={() => setNoteDialogOpen(true)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      Add Note <StickyNote className="h-4 w-4" />
                    </Button>
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

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-[150px]"
              placeholder="Add important details or context here... These notes will take precedence over question answers when generating assets."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveNote}
              disabled={isSavingNote || !noteContent.trim()}
              className="bg-black text-white hover:bg-black/90"
            >
              {isSavingNote ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export the component with error boundary
export default function AssetsReviewer() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AssetsReviewerContent />
    </ErrorBoundary>
  );
}
