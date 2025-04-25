"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
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
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "react-error-boundary";
import { newlyCreatedAssetIdAtom } from "./add-asset-button";
import { FirestoreAsset } from "@/lib/firebase/initialize-assets";
import {
  allAssetsAtom,
  selectedAssetPhasesAtom,
} from "@/lib/store/assets-store";
import { useXp } from "@/xp/useXp";
import { toast as showToast } from "@/hooks/use-toast";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Interface definitions
interface Note {
  id: string;
  note_body: string;
  last_modified: string;
}

// Interface for AssetsReviewerContent props
interface AssetsReviewerContentProps {
  onShowToast: (options: ShowToastOptions) => void;
}

// Loading skeleton component
// function AssetsReviewerSkeleton() {
//   return (
//     <div className="w-full p-4 space-y-4">
//       <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {Array(6)
//           .fill(0)
//           .map((_, i) => (
//             <div
//               key={i}
//               className="h-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
//             ></div>
//           ))}
//       </div>
//     </div>
//   );
// }

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
function AssetsReviewerContent({ onShowToast }: AssetsReviewerContentProps) {
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
  const { awardXp } = useXp();

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
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProductId);

        if (
          response.success &&
          "assets" in response &&
          Array.isArray(response.assets)
        ) {
          const assetMap: Record<string, FirestoreAsset> = {};
          response.assets.forEach((asset) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });
          setFirestoreAssets(assetMap);
        } else if (!response.success) {
          console.error("Failed to fetch assets:", response.error);
          onShowToast({
            title: "Error loading assets",
            description: response.error || "Failed to fetch assets",
            variant: "destructive",
          });
        }

        const { getProjectNotesAction } = await import(
          "../actions/get-project-notes-action"
        );
        const notesResponse = await getProjectNotesAction(selectedProductId);

        if (notesResponse.success && notesResponse.notes) {
          setNotes(notesResponse.notes as Note[]);
        }
      } catch (error) {
        console.error("Error loading Firestore assets:", error);
        onShowToast({
          title: "Error loading assets",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFirestoreAssets();
  }, [selectedProductId, onShowToast]);

  // Use the newly created asset ID to trigger immediate refresh and selection
  useEffect(() => {
    if (!newlyCreatedAssetId) return;

    const refreshAssets = async () => {
      if (!selectedProductId) return;
      setIsLoading(true);
      try {
        setSelectedAssetId(newlyCreatedAssetId);
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProductId);

        if (
          response.success &&
          "assets" in response &&
          Array.isArray(response.assets)
        ) {
          const assetMap: Record<string, FirestoreAsset> = {};
          response.assets.forEach((asset) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });
          setFirestoreAssets(assetMap);

          const assets = Object.values(assetMap);
          if (selectedPhases.includes("All")) {
            setDisplayedAssets(assets);
          } else {
            const filteredAssets = assets.filter((asset) =>
              selectedPhases.includes(asset.phase)
            );
            setDisplayedAssets(filteredAssets);
          }

          if (newlyCreatedAssetId in assetMap) {
            setSelectedAssetId(newlyCreatedAssetId);
            setAssetContent(
              assetMap[newlyCreatedAssetId].content || "# No content available"
            );
          } else {
            setSelectedAssetId("");
            setAssetContent("");
          }

          setNewlyCreatedAssetId(null);
        } else if (!response.success) {
          console.error("Failed to refresh assets:", response.error);
          onShowToast({
            title: "Error refreshing assets",
            description:
              response.error || "Failed to refresh assets after creation",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error refreshing assets after creation:", error);
        onShowToast({
          title: "Error refreshing assets",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    refreshAssets();
  }, [
    newlyCreatedAssetId,
    selectedProductId,
    setNewlyCreatedAssetId,
    selectedPhases,
    onShowToast,
  ]);

  // Load asset content when selected
  useEffect(() => {
    async function loadAssetContent() {
      if (!selectedAssetId) {
        setAssetContent("");
        return;
      }
      const selectedAssetData = firestoreAssets[selectedAssetId];
      if (selectedAssetData) {
        setAssetContent(selectedAssetData.content || "# No content available");
      } else {
        setAssetContent("# Asset details not loaded");
        console.warn(`Asset ${selectedAssetId} not found in cache.`);
      }
    }

    loadAssetContent();
  }, [selectedAssetId, firestoreAssets]);

  const handleSave = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    const selectedAsset = firestoreAssets[selectedAssetId];
    if (!selectedAsset) {
      onShowToast({
        title: "Save Error",
        description: "Cannot save, asset data not found.",
        variant: "destructive",
      });
      return;
    }

    setSaveStatus("saving");
    setIsSaving(true);
    try {
      const { saveAssetAction } = await import("../actions/asset-actions");
      const response = await saveAssetAction({
        productId: selectedProductId,
        asset: {
          ...selectedAsset,
          content: assetContent,
        },
      });

      if (response.success) {
        setFirestoreAssets((prev) => ({
          ...prev,
          [selectedAssetId]: {
            ...prev[selectedAssetId],
            content: assetContent,
          },
        }));

        setSaveStatus("success");
        onShowToast({
          title: "Asset Saved",
          description: "Content updated successfully.",
        });
        setIsEditing(false);
      } else {
        throw new Error(response.error || "Failed to save content");
      }
    } catch (error) {
      setSaveStatus("error");
      console.error("Error saving asset content:", error);
      onShowToast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    const assetIdToPreserve = selectedAssetId;
    setIsGenerating(true);
    try {
      const { generateAsset } = await import("../actions/generate-asset");
      const response = await generateAsset({
        productId: selectedProductId,
        assetId: assetIdToPreserve,
      });

      if (response.success && response.content) {
        setAssetContent(response.content);
        setIsEditing(true);

        setFirestoreAssets((prev) => ({
          ...prev,
          [assetIdToPreserve]: {
            ...prev[assetIdToPreserve],
            content: response.content,
          },
        }));

        const actionId = "generate_asset";
        const pointsAwarded = 5;
        let toastDescription = "Content generated successfully.";

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
          title: "Content Generated",
          description: toastDescription,
          duration: 5000,
        });
      } else {
        throw new Error(response.error || "Failed to generate content");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      onShowToast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setSelectedAssetId(assetIdToPreserve);
    }
  };

  const handleDownload = async () => {
    if (!selectedAssetId || !selectedProductId) return;

    try {
      const { downloadSingleAssetAction } = await import(
        "../actions/asset-actions"
      );
      const response = await downloadSingleAssetAction({
        productId: selectedProductId,
        assetId: selectedAssetId,
      });

      if (response.success && response.asset) {
        const { title, content } = response.asset;
        const safeTitle = title
          .replace(/[<>:"/\\|?*]/g, "-")
          .replace(/\s+/g, " ")
          .trim();
        const fileName = `${safeTitle || "asset"}.md`;
        const blob = new Blob([content], { type: "text/markdown" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        const actionId = "download_asset";
        const pointsAwarded = 5;
        let toastDescription = `\"${fileName}\" downloaded successfully.`;

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
          title: "Download Successful",
          description: toastDescription,
          duration: 5000,
        });
      } else {
        throw new Error(response.error || "Failed to prepare download");
      }
    } catch (error) {
      console.error("Error downloading asset:", error);
      onShowToast({
        title: "Download Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Check if an asset exists in our Firestore cache
  // const assetExistsInFirestore = (assetId: string) => {
  //   return !!firestoreAssets[assetId];
  // };

  const handleSaveNote = async () => {
    if (!selectedProductId || !noteContent.trim()) {
      onShowToast({
        title: "Save Error",
        description: "Cannot save note without product selected or content.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingNote(true);
    const noteId = uuidv4();
    const note: Note = {
      id: noteId,
      note_body: noteContent,
      last_modified: new Date().toISOString(),
    };

    try {
      const prevNotes = notes;
      setNotes([note, ...notes]);
      setNoteContent("");
      setNoteDialogOpen(false);

      const { saveNoteAction } = await import("../actions/notes-actions");
      const response = await saveNoteAction({
        productId: selectedProductId,
        note: {
          id: noteId,
          note_body: note.note_body,
        },
      });

      if (response.success) {
        const actionId = "create_note";
        const pointsAwarded = 5;
        let toastDescription = "Note added successfully.";

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
          title: "Note Added",
          description: toastDescription,
          duration: 5000,
        });

        if (response.note) {
          setNotes((currentNotes) =>
            currentNotes.map((n) =>
              n.id === noteId
                ? {
                    ...n,
                    ...response.note,
                    last_modified:
                      response.note.last_modified?.toString() ||
                      note.last_modified,
                  }
                : n
            )
          );
        }
      } else {
        setNotes(prevNotes);
        setNoteContent(note.note_body);
        setNoteDialogOpen(true);
        throw new Error(response.error || "Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setNoteDialogOpen(true);
      onShowToast({
        title: "Error Saving Note",
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
    const assetIdToDelete = selectedAssetId;
    const deletedAssetTitle =
      firestoreAssets[assetIdToDelete]?.title || "asset";

    try {
      const updatedAssets = { ...firestoreAssets };
      delete updatedAssets[assetIdToDelete];
      setFirestoreAssets(updatedAssets);
      setAllAssets(Object.values(updatedAssets));

      const currentIndex = displayedAssets.findIndex(
        (asset) => asset.id === assetIdToDelete
      );
      setSelectedAssetId("");
      setAssetContent("");
      setDeleteDialogOpen(false);

      const { deleteAssetAction } = await import("../actions/asset-actions");
      const response = await deleteAssetAction({
        productId: selectedProductId,
        assetId: assetIdToDelete,
      });

      if (response.success) {
        onShowToast({
          title: "Asset Deleted",
          description: `\"${deletedAssetTitle}\" was deleted successfully.`,
        });

        const newDisplayedAssets = Object.values(updatedAssets).filter(
          (asset) =>
            selectedPhases.includes("All") ||
            selectedPhases.includes(asset.phase)
        );
        if (newDisplayedAssets.length > 0) {
          const newSelectionIndex = Math.min(
            Math.max(0, currentIndex),
            newDisplayedAssets.length - 1
          );
          setSelectedAssetId(newDisplayedAssets[newSelectionIndex].id);
        }
      } else {
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const refreshResponse = await getProductAssetsAction(selectedProductId);
        if (
          refreshResponse.success &&
          "assets" in refreshResponse &&
          Array.isArray(refreshResponse.assets)
        ) {
          const assetMap: Record<string, FirestoreAsset> = {};
          refreshResponse.assets.forEach((asset) => {
            assetMap[asset.id] = asset as FirestoreAsset;
          });
          setFirestoreAssets(assetMap);
          setAllAssets(refreshResponse.assets as FirestoreAsset[]);
          if (assetMap[assetIdToDelete]) {
            setSelectedAssetId(assetIdToDelete);
          }
        }
        throw new Error(response.error || "Failed to delete asset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      onShowToast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      if (firestoreAssets[assetIdToDelete]) {
        setSelectedAssetId(assetIdToDelete);
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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

// Define props for the wrapper component
interface AssetsReviewerProps {
  onShowToast: (options: ShowToastOptions) => void;
}

// Export the component with error boundary
export default function AssetsReviewer({ onShowToast }: AssetsReviewerProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AssetsReviewerContent onShowToast={onShowToast} />
    </ErrorBoundary>
  );
}
