"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { useXpMutation } from "@/xp/useXpMutation";
import { Plus, Trash, Sparkles } from "lucide-react";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Prompt, PromptInput } from "@/lib/firebase/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useEffect, useState, useRef } from "react";
import { PromptTable } from "./components/prompt-table";
import { PromptForm } from "./components/prompt-form";
import {
  createPromptAction,
  updatePromptAction,
  deletePromptAction,
  deleteMultiplePromptsAction,
} from "./actions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAtom, useSetAtom } from "jotai";
import {
  promptRowSelectionAtom,
  layoutViewAtom,
  updatePromptAtom,
  deletePromptAtom,
  deleteMultiplePromptsAtom,
  addPromptAtom,
  highlightedPromptIdAtom,
  promptPhaseFilterAtom,
  promptSearchQueryAtom,
  selectedPromptAtom,
} from "@/lib/store/prompt-store";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { FilterBar } from "@/components/ui/components/filter-bar";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebasePrompts } from "@/lib/firebase/client/FirebasePrompts";
import { NotesPrimaryButtons } from "../notes/components/notes-primary-buttons";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyPrompts() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView] = useAtom(layoutViewAtom);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);
  const [highlightedPromptId, setHighlightedPromptId] = useAtom(
    highlightedPromptIdAtom
  );
  const highlightedCardRef = useRef<HTMLDivElement>(null);
  const [phaseFilter] = useAtom(promptPhaseFilterAtom);
  const [searchQuery] = useAtom(promptSearchQueryAtom);

  // Add atoms for optimistic updates
  const updatePrompt = useSetAtom(updatePromptAtom);
  const deletePrompt = useSetAtom(deletePromptAtom);
  const deleteMultiplePrompts = useSetAtom(deleteMultiplePromptsAtom);
  const addPrompt = useSetAtom(addPromptAtom);
  const setSelectedPrompt = useSetAtom(selectedPromptAtom);
  const setPhaseFilter = useSetAtom(promptPhaseFilterAtom);

  // Row selection state
  const [rowSelection, setRowSelection] = useAtom(promptRowSelectionAtom);
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  // Use react-firebase-hooks to get prompts directly
  const [promptsData, isLoading, firestoreError] = useCollectionData(
    phaseFilter.length > 0
      ? firebasePrompts.getUserPromptsByPhase(phaseFilter)
      : firebasePrompts.getUserPrompts(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include the document ID
  const prompts = (promptsData || []).map((prompt) => ({
    ...prompt,
    id: prompt.id,
  })) as Prompt[];

  // Apply search filter
  const filteredPrompts =
    searchQuery.trim() === ""
      ? prompts
      : prompts.filter((prompt) => {
          const query = searchQuery.toLowerCase();
          return (
            prompt.title?.toLowerCase().includes(query) ||
            (prompt.body || "").toLowerCase().includes(query)
          );
        });

  // XP mutation
  const xpMutation = useXpMutation();

  // Sort prompts to show newest first
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    // Sort by creation date descending (newest first)
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    router.push("/myprompts/prompt");
  };

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setIsPromptModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsPromptModalOpen(true);
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  const handleTagClick = (tag: string) => {
    // Update the phase filter atom
    if (phaseFilter.includes(tag)) {
      setPhaseFilter(phaseFilter.filter((t) => t !== tag));
    } else {
      setPhaseFilter([...phaseFilter, tag]);
    }
  };

  const handleDeleteSelected = () => {
    setIsMultipleDeleteDialogOpen(true);
  };

  const confirmDeletePrompt = async () => {
    if (!promptToDelete) return;

    setIsSubmitting(true);
    try {
      const result = await deletePromptAction(promptToDelete.id!);

      if (result.success) {
        // Optimistic UI update
        deletePrompt(promptToDelete.id!);

        // Close the dialog
        setIsDeleteDialogOpen(false);
        toast({
          title: "Success",
          description: "Prompt deleted",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompt",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMultiple = async () => {
    const selectedPromptIds = Object.keys(rowSelection)
      .map((index) => prompts[parseInt(index)]?.id)
      .filter(Boolean) as string[];

    if (selectedPromptIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await deleteMultiplePromptsAction(selectedPromptIds);

      if (result.success) {
        // Optimistic update
        deleteMultiplePrompts(selectedPromptIds);

        // Clear selection
        setRowSelection({});

        toast({
          title: "Success",
          description: `${selectedPromptIds.length} prompts deleted`,
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsMultipleDeleteDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompts",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrompt = async (data: PromptInput, promptId?: string) => {
    setIsSubmitting(true);
    try {
      if (promptId) {
        // Update existing prompt
        const result = await updatePromptAction(promptId, data);

        if (result.success) {
          // Update prompt in atom for optimistic UI updates
          updatePrompt(result.prompt!);

          toast({
            title: "Success",
            description: "Prompt updated successfully",
            duration: TOAST_DEFAULT_DURATION,
          });
          setIsPromptModalOpen(false);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update prompt",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } else {
        // Create new prompt
        const result = await createPromptAction(data);

        if (result.success && result.prompt) {
          // Optimistic update - add the new prompt
          addPrompt(result.prompt);

          // Award XP for creating a new prompt - using background mutation
          xpMutation.mutate("create_prompt");

          toast({
            title: "Success",
            description: "Prompt created successfully (+30 XP)",
            duration: TOAST_DEFAULT_DURATION,
          });
          setIsPromptModalOpen(false);

          // Navigate to the prompt detail page with the newly created prompt
          // This is now handled by useCollectionData
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create prompt",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      }
    } catch (error) {
      console.error("Error submitting prompt:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
      // No need to refresh the entire list for a single prompt creation error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Main>
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "My Prompts", isCurrentPage: true },
        ]}
      />

      <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">My Prompts</h2>
          <p className="text-muted-foreground">Manage your prompts here.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasSelectedRows && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isSubmitting}
              className="h-9"
            >
              <Trash className="h-4 w-4 mr-2" /> Delete Selected
            </Button>
          )}
          <Button
            onClick={() => router.push("/myprompts/pace")}
            variant="outline"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create PACE Prompt
          </Button>
          <Button onClick={handleCreatePrompt}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Prompt
          </Button>
        </div>
      </div>

      {/* Use the FilterBar component */}
      <FilterBar
        mode="prompts"
        placeholderText="Filter prompts..."
        data-testid="prompt-filter-bar"
      />

      <div className="py-3" />
      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !firestoreError && prompts.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No personal prompts found</h2>
          <p className="text-muted-foreground mt-2">
            Create a new prompt or copy one from the public collection
          </p>
          <Button
            onClick={() => router.push("/prompts")}
            variant="outline"
            className="mt-4"
          >
            Browse Public Prompts
          </Button>
        </div>
      )}

      {/* Prompt cards grid */}
      {!isLoading &&
        !firestoreError &&
        prompts.length > 0 &&
        layoutView === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                ref={
                  prompt.id === highlightedPromptId
                    ? highlightedCardRef
                    : undefined
                }
                className={`transition-all duration-300 ${prompt.id === highlightedPromptId ? "scale-[1.02]" : ""}`}
              >
                <PromptCard
                  prompt={prompt}
                  onClick={handlePromptClick}
                  onEdit={handleEditPrompt}
                  onDelete={handleDeletePrompt}
                  onTagClick={handleTagClick}
                />
              </div>
            ))}
          </div>
        )}

      {/* Table view */}
      {!isLoading &&
        !firestoreError &&
        prompts.length > 0 &&
        layoutView === "table" && (
          <PromptTable
            data={sortedPrompts}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
            onTagClick={handleTagClick}
            onClick={handlePromptClick}
          />
        )}

      {/* Prompt edit/create modal */}
      <PromptForm
        prompt={editingPrompt}
        open={isPromptModalOpen}
        onOpenChange={setIsPromptModalOpen}
        onSubmit={handleSubmitPrompt}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              prompt
              <span className="font-semibold">
                {promptToDelete && ` "${promptToDelete.title}"`}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePrompt}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Multiple delete confirmation dialog */}
      <AlertDialog
        open={isMultipleDeleteDialogOpen}
        onOpenChange={setIsMultipleDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple prompts?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMultiple}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
