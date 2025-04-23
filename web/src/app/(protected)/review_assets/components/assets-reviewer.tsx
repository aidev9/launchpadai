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
  Trash2,
  Wand2,
  Download,
  Circle,
  Check,
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
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "react-error-boundary";
import { newlyCreatedAssetIdAtom } from "./add-asset-button";
import { FirestoreAsset } from "@/lib/firebase/initialize-assets";
import {
  allAssetsAtom,
  selectedAssetPhasesAtom,
} from "@/lib/store/assets-store";

// Interface definitions
interface Note {
  id: string;
  note_body: string;
  last_modified: string;
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
  const [selectedPhases] = useAtom(selectedAssetPhasesAtom);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [assetContent, setAssetContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [displayedAssets, setDisplayedAssets] = useState<FirestoreAsset[]>([]);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setAllAssets] = useAtom(allAssetsAtom);

  // Filter assets based on selected phases
  useEffect(() => {
    if (!Object.keys(firestoreAssets).length) return;

    const assets = Object.values(firestoreAssets);
    let filteredAssets;

    if (selectedPhases.includes("All")) {
      filteredAssets = assets;
    } else {
      filteredAssets = assets.filter((asset) =>
        selectedPhases.includes(asset.phase)
      );
    }

    setDisplayedAssets(filteredAssets);

    // Only clear selection if the currently selected asset is not in the filtered assets
    if (selectedAssetId) {
      const assetStillVisible = filteredAssets.some(
        (asset) => asset.id === selectedAssetId
      );
      if (!assetStillVisible) {
        setSelectedAssetId("");
        setAssetContent("");
      }
    }
  }, [selectedPhases, firestoreAssets, selectedAssetId]);

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

        if (response.success && "assets" in response && response.assets) {
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

  // Use the newly created asset ID to trigger immediate refresh and selection
  useEffect(() => {
    if (!newlyCreatedAssetId) return;

    console.log("New asset created, ID:", newlyCreatedAssetId);

    // Refresh asset list from Firestore and select the new asset
    const refreshAssets = async () => {
      if (!selectedProductId) return;

      setIsLoading(true);

      try {
        // First, directly select the ID to ensure UI responsiveness
        setSelectedAssetId(newlyCreatedAssetId);

        // Dynamically import server action
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProductId);

        if (response.success && "assets" in response && response.assets) {
          console.log("Fetched assets:", response.assets.length);

          // Create a map of asset ID to asset data
          const assetMap: Record<string, FirestoreAsset> = {};
          response.assets.forEach((asset: any) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });

          // Find the newly created asset
          const newAsset = response.assets.find(
            (asset: any) => asset.id === newlyCreatedAssetId
          );

          if (newAsset) {
            console.log("Found new asset in response:", newAsset.title);
          } else {
            console.log("New asset not found in response");
          }

          // Update Firestore assets
          setFirestoreAssets(assetMap);

          // Update displayed assets based on current phase filter
          const assets = Object.values(assetMap);
          if (selectedPhases.includes("All")) {
            setDisplayedAssets(assets);
          } else {
            const filteredAssets = assets.filter((asset) =>
              selectedPhases.includes(asset.phase)
            );
            setDisplayedAssets(filteredAssets);
          }

          // Ensure the asset is selected
          setSelectedAssetId(newlyCreatedAssetId);

          // Load the content of the newly created asset
          if (newlyCreatedAssetId in assetMap) {
            setAssetContent(
              assetMap[newlyCreatedAssetId].content || "# No content available"
            );
          }

          // Add a double-check to ensure selection persists
          setTimeout(() => {
            if (selectedAssetId !== newlyCreatedAssetId) {
              console.log("Selection lost, reselecting asset");
              setSelectedAssetId(newlyCreatedAssetId);
            }
          }, 200);
        }
      } catch (error) {
        console.error("Error refreshing assets after creation:", error);
        toast({
          title: "Error refreshing assets",
          description:
            "Your asset was created but the list couldn't be refreshed.",
          variant: "destructive",
        });

        // Even if there's an error, try to select the asset
        setSelectedAssetId(newlyCreatedAssetId);
      } finally {
        setIsLoading(false);

        // Always clear the newly created asset ID after processing
        setTimeout(() => {
          setNewlyCreatedAssetId(null);
        }, 300);
      }
    };

    // Execute the refresh
    refreshAssets();
  }, [
    newlyCreatedAssetId,
    selectedProductId,
    setNewlyCreatedAssetId,
    selectedPhases,
  ]);

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
            "asset" in response &&
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

  const handleSave = async () => {
    if (!selectedAssetId || !selectedProductId || !assetContent) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      // Get metadata for this asset from Firestore assets
      const selectedAsset = firestoreAssets[selectedAssetId];
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
          title: selectedAsset.title,
          description: selectedAsset.description,
          systemPrompt: selectedAsset.systemPrompt,
          tags: selectedAsset.tags,
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
          last_updated: new Date(),
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

    const assetIdToPreserve = selectedAssetId;
    setIsGenerating(true);

    try {
      // Use server action
      const { generateAsset } = await import("../actions/generate-asset");
      const response = await generateAsset({
        productId: selectedProductId,
        assetId: assetIdToPreserve,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to generate asset");
      }

      // Update the content with the generated content
      setAssetContent(response.content || "");

      // Ensure the asset remains selected
      setSelectedAssetId(assetIdToPreserve);

      // Update local Firestore assets cache
      const selectedAsset = firestoreAssets[assetIdToPreserve];
      if (selectedAsset) {
        setFirestoreAssets((prev) => ({
          ...prev,
          [assetIdToPreserve]: {
            ...selectedAsset,
            content: response.content || "",
            last_updated: new Date(),
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
      // Ensure the asset remains selected after generation completes
      setSelectedAssetId(assetIdToPreserve);
    }
  };

  const handleDownload = () => {
    if (!selectedAssetId || !assetContent.trim()) return;

    // Get the asset title for the filename
    const asset = firestoreAssets[selectedAssetId];
    if (!asset) return;

    // Create a safe filename from the asset title
    const title = asset.title || "asset";
    const safeTitleForFilename = title
      .replace(/[<>:"/\\|?*]/g, "-") // Replace invalid filename characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Generate filename with .md extension
    const fileName = safeTitleForFilename.endsWith(".md")
      ? safeTitleForFilename
      : `${safeTitleForFilename}.md`;

    // Create a blob with the markdown content
    const blob = new Blob([assetContent], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Asset downloaded",
      description: `${fileName} has been downloaded successfully.`,
    });
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

  const handleDelete = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    setIsDeleting(true);

    try {
      // Use server action to delete asset
      const { deleteAssetAction } = await import("../actions/asset-actions");
      const response = await deleteAssetAction({
        productId: selectedProductId,
        assetId: selectedAssetId,
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Remove from local state
      setFirestoreAssets((prev) => {
        const updated = { ...prev };
        delete updated[selectedAssetId];
        return updated;
      });

      // Update displayed assets
      setDisplayedAssets((prev) =>
        prev.filter((asset) => asset.id !== selectedAssetId)
      );

      // Close dialog
      setDeleteDialogOpen(false);

      // Select the first asset if available
      const remainingAssets = displayedAssets.filter(
        (asset) => asset.id !== selectedAssetId
      );

      if (remainingAssets.length > 0) {
        setSelectedAssetId(remainingAssets[0].id);
      } else {
        setSelectedAssetId("");
        setAssetContent("");
      }

      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Error deleting asset",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to check if asset has content
  const hasContent = (asset: FirestoreAsset) => {
    return asset.content && asset.content.trim().length > 0;
  };

  // Update all assets when firestoreAssets changes
  useEffect(() => {
    if (Object.keys(firestoreAssets).length) {
      const assets = Object.values(firestoreAssets);
      setAllAssets(assets);
    }
  }, [firestoreAssets, setAllAssets]);

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col lg:flex-row lg:min-h-[500px]">
        {/* Left sidebar with assets list */}
        <div className="w-full lg:w-1/4 border-r">
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              <h3 className="text-xl font-bold mb-4">Assets</h3>

              {/* Search/filter input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Filter assets..."
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    if (searchTerm.trim() === "") {
                      // Reset to filtered by phase if search is empty
                      const assets = Object.values(firestoreAssets);
                      if (selectedPhases.includes("All")) {
                        setDisplayedAssets(assets);
                      } else {
                        setDisplayedAssets(
                          assets.filter((asset) =>
                            selectedPhases.includes(asset.phase)
                          )
                        );
                      }
                    } else {
                      // Filter by both phase and search term
                      const assets = Object.values(firestoreAssets);
                      let filteredByPhase;

                      if (selectedPhases.includes("All")) {
                        filteredByPhase = assets;
                      } else {
                        filteredByPhase = assets.filter((asset) =>
                          selectedPhases.includes(asset.phase)
                        );
                      }

                      // Further filter by search term
                      setDisplayedAssets(
                        filteredByPhase.filter((asset) =>
                          asset.title.toLowerCase().includes(searchTerm)
                        )
                      );
                    }
                  }}
                />
                <FileText className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                      />
                    ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {displayedAssets
                    .sort((a, b) => a.order - b.order)
                    .map((asset) => {
                      const isSelected = selectedAssetId === asset.id;
                      const hasAssetContent = hasContent(asset);

                      return (
                        <li key={asset.id}>
                          <div
                            className={`relative rounded-md border p-2 cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30 hover:bg-muted/30"
                            }`}
                            onClick={() => setSelectedAssetId(asset.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                                  isSelected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground text-transparent"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>

                              <div className="flex-1 flex items-center">
                                <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">
                                  {asset.title}
                                </span>
                              </div>

                              {hasAssetContent && (
                                <div
                                  className="w-2 h-2 rounded-full bg-green-500"
                                  title="Has content"
                                ></div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right content area with selected asset */}
        <div className="flex-1 lg:flex-[3]">
          {selectedAssetId ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {firestoreAssets[selectedAssetId]?.title || "Loading..."}
                </h2>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
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
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          // Reload the original content from Firestore to discard changes
                          if (
                            selectedAssetId &&
                            selectedAssetId in firestoreAssets
                          ) {
                            setAssetContent(
                              firestoreAssets[selectedAssetId].content ||
                                "# No content available"
                            );
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        Cancel
                      </Button>
                    </>
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
                        onClick={() => setDeleteDialogOpen(true)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        Delete <Trash2 className="h-4 w-4" />
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
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        Download <Download className="h-4 w-4" />
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
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">No Asset Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select an asset from the list to view or edit its content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Delete Asset</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-center mb-2">
              Are you sure you want to delete this asset?
            </p>
            <p className="text-center text-muted-foreground text-sm">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Asset"}
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
