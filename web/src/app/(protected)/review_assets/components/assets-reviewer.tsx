"use client";
// TODO: Refactor this component - break it down into smaller components

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useCompletion } from "ai/react";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import InsufficientCreditsAlert from "@/components/prompt-credits/insufficient-credits-alert";
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
  X,
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
import { newlyCreatedAssetIdAtom } from "./add-asset-button";
import { FirestoreAsset } from "@/lib/firebase/schema";
import {
  allAssetsAtom,
  selectedAssetPhasesAtom,
} from "@/lib/store/assets-store";
import { useXp } from "@/xp/useXp";
import { toast as showToast } from "@/hooks/use-toast";
import {
  getCurrentUnixTimestamp,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";
import { useMutation } from "@tanstack/react-query";
import { useXpMutation } from "@/xp/useXpMutation";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import MDEditor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

// Dynamically import MarkdownPreview
const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => <p>Loading preview...</p>,
});

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Interface definitions
interface Note {
  id: string;
  note_body: string;
  updatedAt: number;
}

// Interface for AssetsReviewerContent props
interface AssetsReviewerContentProps {
  onShowToast: (options: ShowToastOptions) => void;
}

// Main component
function AssetsReviewerContent({ onShowToast }: AssetsReviewerContentProps) {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedPhases] = useAtom(selectedAssetPhasesAtom);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [assetContent, setAssetContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [displayedAssets, setDisplayedAssets] = useState<FirestoreAsset[]>([]);
  const [firestoreAssets, setFirestoreAssets] = useState<
    Record<string, FirestoreAsset>
  >({});
  const [hasInsufficientCredits, setHasInsufficientCredits] = useState(false);
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
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // --- useCompletion Hook Setup ---
  const {
    completion,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isGenerating,
    error: generationError,
    stop,
    complete,
  } = useCompletion({
    api: "/api/ai-asset-generation",

    onResponse: (response) => {
      if (promptCredits && response.status === 200) {
        setPromptCredits((prev) =>
          prev
            ? {
                ...prev,
                remainingCredits: prev.remainingCredits - 1,
                totalUsedCredits: (prev.totalUsedCredits || 0) + 1,
              }
            : null
        );
      }
    },

    onFinish: async (prompt, completionText) => {
      const assetIdToPreserve = selectedAssetId;
      if (!assetIdToPreserve || !selectedProduct) return;

      setAssetContent(completionText);
      setIsEditing(true);

      setFirestoreAssets((prev) => ({
        ...prev,
        [assetIdToPreserve]: {
          ...prev[assetIdToPreserve],
          content: completionText,
        },
      }));

      try {
        const { saveAsset } = await import("@/lib/firebase/assets");
        const assetToUpdate = firestoreAssets[assetIdToPreserve];
        if (assetToUpdate) {
          await saveAsset(selectedProduct.id, {
            ...assetToUpdate,
            content: completionText,
          });
        }
      } catch (saveError) {
        console.error(
          "Error saving generated content post-completion:",
          saveError
        );
      }

      const actionId = "generate_asset";
      const pointsAwarded = 5;
      xpMutation.mutate(actionId);

      try {
        const result = await fetchPromptCredits();
        if (result.success && result.credits) {
          setPromptCredits(result.credits);
        }
      } catch (error) {
        console.error(
          "Failed to update credit balance post-completion:",
          error
        );
      }

      onShowToast({
        title: "Content Generated",
        description: `Content generated successfully. You earned ${pointsAwarded} XP!`,
        duration: TOAST_DEFAULT_DURATION,
      });

      setSelectedAssetId(assetIdToPreserve);
    },

    onError: (error) => {
      // Check if the error is related to insufficient credits
      const errorStr =
        typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      const errorObj =
        error.message &&
        typeof error.message === "string" &&
        error.message.startsWith("{")
          ? JSON.parse(error.message)
          : null;
      const isInsufficientCreditsError =
        errorStr.toLowerCase().includes("insufficient prompt credits") ||
        errorObj?.error === "Insufficient prompt credits" ||
        errorObj?.needMoreCredits === true;

      if (isInsufficientCreditsError) {
        // Set state to show the alert instead of toast
        setHasInsufficientCredits(true);
      } else {
        // Only log non-credit related errors to console
        console.error("Error generating content via useCompletion:", error);
        // For other errors, show toast as before
        onShowToast({
          title: "Generation Error",
          description:
            error.message || "An unknown error occurred during generation.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }

      fetchPromptCredits()
        .then((result) => {
          if (result.success && result.credits)
            setPromptCredits(result.credits);
        })
        .catch((err) =>
          console.error("Failed to refetch credits after error:", err)
        );
    },
  });
  // --- End useCompletion Hook Setup ---

  // Filter assets based on selected phases
  useEffect(() => {
    if (!Object.keys(firestoreAssets).length) return;

    const assets = Object.values(firestoreAssets);
    let filteredAssets;

    if (selectedPhases.includes("All")) {
      filteredAssets = assets;
    } else {
      filteredAssets = assets.filter((asset) =>
        asset.phases.some((phase) => selectedPhases.includes(phase))
      );
    }

    setDisplayedAssets(filteredAssets);

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
      if (!selectedProduct) return;

      setIsLoading(true);
      try {
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProduct.id);

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
            duration: TOAST_DEFAULT_DURATION,
          });
        }

        const { getProjectNotesAction } = await import(
          "../actions/get-project-notes-action"
        );
        const notesResponse = await getProjectNotesAction(selectedProduct.id);

        if (notesResponse.success && notesResponse.notes) {
          setNotes(notesResponse.notes as Note[]);
        }
      } catch (error) {
        console.error("Error loading Firestore assets:", error);
        onShowToast({
          title: "Error loading assets",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFirestoreAssets();
  }, [selectedProduct, onShowToast]);

  // Use the newly created asset ID to trigger immediate refresh and selection
  useEffect(() => {
    if (!newlyCreatedAssetId) return;

    const refreshAssets = async () => {
      if (!selectedProduct) return;
      setIsLoading(true);
      try {
        setSelectedAssetId(newlyCreatedAssetId);
        const { getProductAssetsAction } = await import(
          "../actions/get-product-assets-action"
        );
        const response = await getProductAssetsAction(selectedProduct.id);

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
              asset.phases.some((phase) => selectedPhases.includes(phase))
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
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } catch (error) {
        console.error("Error refreshing assets after creation:", error);
        onShowToast({
          title: "Error refreshing assets",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      } finally {
        setIsLoading(false);
      }
    };

    refreshAssets();
  }, [
    newlyCreatedAssetId,
    selectedProduct,
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
    if (!selectedAssetId || !selectedProduct) return;

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
        productId: selectedProduct.id,
        asset: {
          ...selectedAsset,
          content: assetContent,
          phases: ["Discover"],
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
          duration: TOAST_DEFAULT_DURATION,
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
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedAssetId || !selectedProduct) return;

    // Reset the insufficient credits state before attempting to generate
    setHasInsufficientCredits(false);

    await complete("", {
      body: {
        productId: selectedProduct.id,
        assetId: selectedAssetId,
      },
    });
  }, [complete, selectedAssetId, selectedProduct]);

  const handleDownload = async () => {
    if (!selectedAssetId || !selectedProduct) return;

    try {
      const { downloadSingleAssetAction } = await import(
        "../actions/asset-actions"
      );
      const response = await downloadSingleAssetAction({
        productId: selectedProduct.id,
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

        xpMutation.mutate(actionId);

        onShowToast({
          title: "Download Successful",
          description: `\"${fileName}\" downloaded successfully. You earned ${pointsAwarded} XP!`,
          duration: TOAST_DEFAULT_DURATION,
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
        duration: TOAST_DEFAULT_DURATION,
      });
    }
  };

  const handleSaveNote = async () => {
    if (!selectedProduct || !noteContent.trim()) {
      onShowToast({
        title: "Save Error",
        description: "Cannot save note without product selected or content.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    setIsSavingNote(true);
    const noteId = uuidv4();
    const note: Note = {
      id: noteId,
      note_body: noteContent,
      updatedAt: getCurrentUnixTimestamp(),
    };

    try {
      const prevNotes = notes;
      setNotes([note, ...notes]);
      setNoteContent("");
      setNoteDialogOpen(false);

      const { saveNoteAction } = await import("../actions/notes-actions");
      const response = await saveNoteAction({
        productId: selectedProduct.id,
        note: {
          id: noteId,
          note_body: note.note_body,
        },
      });

      if (response.success) {
        const actionId = "create_note";
        const pointsAwarded = 5;

        xpMutation.mutate(actionId);

        onShowToast({
          title: "Note Added",
          description: `Note added successfully. You earned ${pointsAwarded} XP!`,
          duration: TOAST_DEFAULT_DURATION,
        });

        if (response.note) {
          setNotes((currentNotes) =>
            currentNotes.map((n) =>
              n.id === noteId
                ? {
                    ...n,
                    ...response.note,
                    updatedAt: response.note.updatedAt || note.updatedAt,
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
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssetId || !selectedProduct) return;

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
        productId: selectedProduct.id,
        assetId: assetIdToDelete,
      });

      if (response.success) {
        onShowToast({
          title: "Asset Deleted",
          description: `\"${deletedAssetTitle}\" was deleted successfully.`,
          duration: TOAST_DEFAULT_DURATION,
        });

        const newDisplayedAssets = Object.values(updatedAssets).filter(
          (asset) =>
            selectedPhases.includes("All") ||
            asset.phases.some((phase) => selectedPhases.includes(phase))
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
        const refreshResponse = await getProductAssetsAction(
          selectedProduct.id
        );
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
        duration: TOAST_DEFAULT_DURATION,
      });
      if (firestoreAssets[assetIdToDelete]) {
        setSelectedAssetId(assetIdToDelete);
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const hasContent = (asset: FirestoreAsset) => {
    return asset.content && asset.content.trim().length > 0;
  };

  useEffect(() => {
    if (Object.keys(firestoreAssets).length) {
      const assets = Object.values(firestoreAssets);
      setAllAssets(assets);
    }
  }, [firestoreAssets, setAllAssets]);

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
      {/* Display insufficient credits alert at the top of the card component */}
      {hasInsufficientCredits && (
        <div className="p-4">
          <InsufficientCreditsAlert />
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:min-h-[500px]">
        <div className="w-full lg:w-1/4 border-r">
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              <h3 className="text-xl font-bold mb-4">Assets</h3>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Filter assets..."
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    if (searchTerm.trim() === "") {
                      const assets = Object.values(firestoreAssets);
                      if (selectedPhases.includes("All")) {
                        setDisplayedAssets(assets);
                      } else {
                        setDisplayedAssets(
                          assets.filter((asset) =>
                            asset.phases.some((phase) =>
                              selectedPhases.includes(phase)
                            )
                          )
                        );
                      }
                    } else {
                      const assets = Object.values(firestoreAssets);
                      let filteredByPhase;

                      if (selectedPhases.includes("All")) {
                        filteredByPhase = assets;
                      } else {
                        filteredByPhase = assets.filter((asset) =>
                          asset.phases.some((phase) =>
                            selectedPhases.includes(phase)
                          )
                        );
                      }

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
                <ul className="space-y-2" data-testid="asset-list-container">
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
                        disabled={isGenerating}
                      >
                        Edit <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setDeleteDialogOpen(true)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        disabled={isGenerating}
                      >
                        Delete <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleGenerate}
                        disabled={
                          isGenerating ||
                          isSaving ||
                          isEditing ||
                          hasInsufficientCredits
                        }
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        data-testid="generate-button"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin mr-1 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate <Wand2 className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                      {isGenerating && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={stop}
                          className="h-auto w-auto p-1 text-muted-foreground hover:text-destructive"
                          title="Stop generation"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Stop Generation</span>
                        </Button>
                      )}
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        disabled={isGenerating}
                      >
                        Download <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                {isGenerating && !completion && (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {isGenerating && completion && (
                  <div className="relative overflow-auto h-full">
                    <div className="p-2 sticky top-0 bg-blue-50 text-blue-800 flex items-center gap-2 border-b z-10">
                      <div className="animate-pulse flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-600"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-600 animate-bounce delay-100"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-600 animate-bounce delay-200"></div>
                      </div>
                      <span className="text-sm font-medium">
                        AI is generating content...
                      </span>
                    </div>
                    <div className="overflow-auto h-[calc(100%-2.5rem)] p-2 border-t border-blue-200">
                      <MarkdownPreview
                        source={completion}
                        style={{ whiteSpace: "pre-wrap", height: "100%" }}
                      />
                    </div>
                  </div>
                )}

                {isEditing && !isGenerating && (
                  <div className="h-[calc(100%-0rem)] overflow-auto border rounded-md">
                    {" "}
                    <MDEditor
                      value={assetContent}
                      onChange={(value?: string) =>
                        setAssetContent(value || "")
                      }
                      height="400px"
                      preview="edit"
                      visibleDragbar={false}
                    />
                  </div>
                )}

                {!isEditing && !isGenerating && (
                  <div
                    className="overflow-auto h-[380px] p-2 border rounded-md" // Fixed height container
                    data-testid="content-display"
                  >
                    <MDEditor
                      value={assetContent}
                      onChange={(value?: string) =>
                        setAssetContent(value || "")
                      }
                      height="400px"
                      preview="preview"
                      visibleDragbar={false}
                    />
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AssetsReviewerProps {
  onShowToast: (options: ShowToastOptions) => void;
}

export default function AssetsReviewer({ onShowToast }: AssetsReviewerProps) {
  return <AssetsReviewerContent onShowToast={onShowToast} />;
}
