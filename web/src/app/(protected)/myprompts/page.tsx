"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useXp } from "@/xp/useXp";
import {
  Plus,
  Search as SearchIcon,
  X,
  LayoutGrid,
  Table as TableIcon,
  XCircle,
  Trash,
  Copy,
  Download,
  Sparkles,
} from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import { PhaseFilter, getPhaseColor } from "@/components/prompts/phase-filter";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Prompt, PromptInput } from "@/lib/firebase/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
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
  columnFiltersAtom,
  columnVisibilityAtom,
  promptRowSelectionAtom,
  sortingAtom,
  layoutViewAtom,
  updatePromptAtom,
  deletePromptAtom,
  deleteMultiplePromptsAtom,
  addPromptAtom,
  highlightedPromptIdAtom,
} from "@/lib/store/prompt-store";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyPrompts() {
  const router = useRouter();
  const { toast } = useToast();
  const { awardXp } = useXp();
  const [layoutView, setLayoutView] = useAtom(layoutViewAtom);
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

  // Add atoms for optimistic updates
  const updatePrompt = useSetAtom(updatePromptAtom);
  const deletePrompt = useSetAtom(deletePromptAtom);
  const deleteMultiplePrompts = useSetAtom(deleteMultiplePromptsAtom);
  const addPrompt = useSetAtom(addPromptAtom);

  // Row selection state
  const [rowSelection, setRowSelection] = useAtom(promptRowSelectionAtom);
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  const {
    prompts,
    isLoading,
    error,
    phaseFilter,
    setPhaseFilter,
    searchQuery,
    setSearchQuery,
    setSelectedPrompt,
    fetchUserPrompts,
    fetchPromptById,
  } = usePrompts({
    userPromptsOnly: true,
  });

  // Sort prompts to show newest first
  const sortedPrompts = [...prompts].sort((a, b) => {
    // Sort by creation date descending (newest first)
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Only fetch prompts on initial mount, not when highlighted prompt ID changes
  useEffect(() => {
    // Only fetch on initial mount if we don't have prompts yet
    if (prompts.length === 0) {
      fetchUserPrompts(true);
    }
  }, [fetchUserPrompts, prompts.length]);

  // Check for highlighted prompt and scroll to it
  useEffect(() => {
    if (highlightedPromptId && sortedPrompts.length > 0) {
      // Find the prompt in the sorted list
      const highlightedPrompt = sortedPrompts.find(
        (p) => p.id === highlightedPromptId
      );

      if (!highlightedPrompt) {
        // If we can't find the prompt in the current list, fetch it
        fetchUserPrompts(false).then(() => {
          // The scroll effect will happen on the next render when the prompt is available
        });
        return;
      }

      // Scroll to the highlighted prompt after a short delay to ensure rendering
      setTimeout(() => {
        if (highlightedCardRef.current) {
          highlightedCardRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Add a temporary highlight effect with green border
          highlightedCardRef.current.classList.add(
            "ring-4",
            "ring-green-500",
            "ring-opacity-70",
            "transition-all",
            "duration-500"
          );

          // Remove the highlight effect after a delay
          setTimeout(() => {
            if (highlightedCardRef.current) {
              highlightedCardRef.current.classList.remove(
                "ring-4",
                "ring-green-500",
                "ring-opacity-70"
              );

              // Clear the highlighted prompt ID after the animation
              setHighlightedPromptId(null);
            }
          }, 3000);
        }
      }, 300);
    }
  }, [
    highlightedPromptId,
    sortedPrompts,
    setHighlightedPromptId,
    fetchUserPrompts,
  ]);

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    router.push("/myprompts/prompt");
  };

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setIsPromptModalOpen(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleEditPrompt = (prompt: Prompt) => {
    if (!prompt || !prompt.id) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: "Cannot edit prompt - missing prompt data",
        variant: "destructive",
      });
      return;
    }

    setEditingPrompt({ ...prompt });
    setIsPromptModalOpen(true);
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    if (!prompt || !prompt.id) {
      toast({
        title: "Error",
        description: "Cannot delete prompt - missing prompt ID",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    setPromptToDelete({ ...prompt });
    setIsDeleteDialogOpen(true);
  };

  const handleTagClick = (tag: string) => {
    // Add the tag to the phase filter if it's not already there
    if (!phaseFilter.includes(tag)) {
      setPhaseFilter([...phaseFilter, tag]);
    }
  };

  const handleSubmitPrompt = async (data: PromptInput, promptId?: string) => {
    setIsSubmitting(true);
    try {
      if (promptId) {
        // Optimistic update
        if (editingPrompt) {
          const optimisticPrompt = {
            ...editingPrompt,
            ...data,
            updatedAt: Date.now() / 1000, // Current timestamp
          };
          updatePrompt(optimisticPrompt);
        }

        // Perform actual update
        const result = await updatePromptAction(promptId, data);

        if (result.success) {
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
          // Only refresh the specific prompt that failed to update
          if (editingPrompt?.id) {
            fetchPromptById(editingPrompt.id);
          }
        }
      } else {
        // Create new prompt
        const result = await createPromptAction(data);

        if (result.success && result.prompt) {
          // Optimistic update - add the new prompt
          addPrompt(result.prompt);

          // Award XP for creating a new prompt
          await awardXp("create_prompt");

          toast({
            title: "Success",
            description: "Prompt created successfully (+30 XP)",
            duration: TOAST_DEFAULT_DURATION,
          });
          setIsPromptModalOpen(false);

          // Navigate to the prompt detail page with the newly created prompt
          setSelectedPrompt(result.prompt);
          router.push("/myprompts/prompt");
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

  const handleConfirmDelete = async () => {
    if (!promptToDelete || !promptToDelete.id) return;

    try {
      // Optimistic update
      deletePrompt(promptToDelete.id);

      // Actual delete operation
      const result = await deletePromptAction(promptToDelete.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Prompt deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompt",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        // If deletion failed, we need to add the prompt back to the UI
        // We can do this by fetching just that prompt
        if (promptToDelete?.id) {
          fetchPromptById(promptToDelete.id);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      // If deletion failed, we need to add the prompt back to the UI
      if (promptToDelete?.id) {
        fetchPromptById(promptToDelete.id);
      }
    } finally {
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  // Function to handle multiple delete
  const handleDeleteSelected = () => {
    // Open confirmation dialog
    setIsMultipleDeleteDialogOpen(true);
  };

  // Function to execute multiple delete after confirmation
  const executeMultipleDelete = async () => {
    try {
      setIsSubmitting(true);

      // Get selected prompts from the table data
      const selectedPromptIds = prompts
        .filter((_, index) => rowSelection[index])
        .map((prompt) => prompt.id as string)
        .filter(Boolean);

      if (selectedPromptIds.length === 0) {
        setIsMultipleDeleteDialogOpen(false);
        return;
      }

      // Call server action to delete multiple prompts
      const result = await deleteMultiplePromptsAction(selectedPromptIds);

      if (result.success) {
        // Optimistically update UI with deletion
        deleteMultiplePrompts(selectedPromptIds);

        // Reset row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Prompts deleted",
          description: `Successfully deleted ${result.deletedCount} prompt${result.deletedCount !== 1 ? "s" : ""}.`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        // Show error message
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompts",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });

        // Refresh the data to restore the deleted prompts
        fetchUserPrompts(false);

        // Refresh the data to restore the deleted prompts
        fetchUserPrompts(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
      setIsMultipleDeleteDialogOpen(false);
    }
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Prompts", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Prompts</h1>
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

        {/* Filter and Search row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Phase filter pills */}
          <div className="w-full md:flex-1 overflow-x-auto pb-2">
            <div className="inline-flex md:flex flex-nowrap md:flex-wrap">
              <PhaseFilter
                selectedPhases={phaseFilter}
                onChange={setPhaseFilter}
              />
            </div>
          </div>

          {/* Search bar and view toggles */}
          <div className="flex gap-2 w-full md:w-auto">
            {/* Search bar - expanded by 20% */}
            <div className="relative w-full md:w-[18rem] flex-shrink-0">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter my prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View toggle buttons */}
            <div className="flex border rounded-md">
              <Button
                variant={layoutView === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("card")}
                className="rounded-r-none"
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutView === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("table")}
                className="rounded-l-none"
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && prompts.length === 0 && (
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
          !error &&
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
          !error &&
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
                This will permanently delete this prompt. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
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
              <AlertDialogTitle>Delete Selected Prompts</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the selected prompts? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  executeMultipleDelete();
                }}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Main>
  );
}
