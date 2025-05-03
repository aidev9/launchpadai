"use client";

import { useState, useEffect } from "react";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Prompt } from "@/lib/firebase/schema";
import { useAtom, useSetAtom } from "jotai";
import {
  getAllPromptsAction,
  deletePromptsAction,
} from "@/lib/firebase/actions/prompts";
import { columns } from "./components/prompts-columns";
import { PromptTable } from "./components/prompt-table";
import { EmptyState } from "./components/empty-state";
import { PromptForm } from "./components/prompt-form";
import { SeedPromptsButton } from "./components/seed-prompts-button";
import { JsonPromptModal } from "./components/json-prompt-modal";
import {
  promptModalOpenAtom,
  promptActionAtom,
  promptRowSelectionAtom,
  initialLoadAtom,
  editedPromptAtom,
} from "@/lib/store/prompt-store";
import { Breadcrumbs } from "@/components/breadcrumbs";

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

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useAtom(promptModalOpenAtom);
  const [promptEdited, setPromptEdited] = useAtom(editedPromptAtom);
  const [promptAction, setPromptAction] = useAtom(promptActionAtom);
  const [initialLoad] = useAtom(initialLoadAtom);
  const [rowSelection] = useAtom(promptRowSelectionAtom);
  const { toast } = useToast();

  // Get selected prompt IDs
  const selectedRows = Object.keys(rowSelection)
    .map((rowId) => prompts[parseInt(rowId)])
    .filter(Boolean);
  const hasSelectedPrompts = selectedRows.length > 0;

  // Initial fetch of prompts
  useEffect(() => {
    async function fetchPrompts() {
      try {
        setLoading(true);
        // Use server action to get all prompts
        const result = await getAllPromptsAction();

        if (result.success) {
          setPrompts(result.prompts || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load prompts",
            variant: "destructive",
          });
          setPrompts([]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompts();
  }, [toast, initialLoad]); // Only fetch on initial load

  // Handle targeted updates to prompts
  useEffect(() => {
    if (!promptAction) return;

    switch (promptAction.type) {
      case "ADD":
        setPrompts((prevPrompts) => [promptAction.prompt, ...prevPrompts]);
        break;

      case "UPDATE":
        setPrompts((prevPrompts) =>
          prevPrompts.map((prompt) =>
            prompt.id === promptAction.prompt.id ? promptAction.prompt : prompt
          )
        );
        break;

      case "DELETE":
        setPrompts((prevPrompts) =>
          prevPrompts.filter((prompt) => prompt.id !== promptAction.promptId)
        );
        break;

      case "DELETE_MANY":
        setPrompts((prevPrompts) =>
          prevPrompts.filter(
            (prompt) =>
              typeof prompt.id !== "undefined" &&
              !promptAction.promptIds.includes(prompt.id)
          )
        );
        break;

      case "LOAD":
        setPrompts(promptAction.prompts);
        break;
    }

    // Reset the action after processing
    setPromptAction(null);
  }, [promptAction, setPromptAction]);

  // Handle deleting selected prompts
  const handleDeleteSelected = async () => {
    setIsDeleting(true);

    try {
      // Get the IDs of the selected prompts
      const selectedPromptIds = selectedRows
        .map((prompt) => prompt.id)
        .filter((id): id is string => typeof id === "string");

      if (selectedPromptIds.length === 0) {
        setDeleteDialogOpen(false);
        return;
      }

      // Use server action for batch deletion
      const result = await deletePromptsAction(selectedPromptIds);

      if (result.success) {
        // Update prompts state to remove deleted prompts
        setPromptAction({
          type: "DELETE_MANY",
          promptIds: selectedPromptIds,
        });

        // Show success message
        toast({
          title: "Prompts deleted",
          description: `Successfully deleted ${selectedPromptIds.length} ${
            selectedPromptIds.length === 1 ? "prompt" : "prompts"
          }`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete selected prompts",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting prompts",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin", href: "/admin" },
          { label: "Prompts", isCurrentPage: true },
        ]}
      />

      <div className="mt-8 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prompts</h2>
          <p className="text-muted-foreground">
            Manage prompts and seed the database with templates
          </p>
        </div>
        {prompts.length > 0 && (
          <div className="flex items-center gap-2">
            <SeedPromptsButton />
            <JsonPromptModal />
            {hasSelectedPrompts && (
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            )}
            <Button
              onClick={() => {
                // Reset the edited prompt
                setPromptEdited(null);
                setPromptModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Prompt
            </Button>
          </div>
        )}
      </div>

      <div className="-mx-4 mt-4 flex-1 overflow-auto px-4 py-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState setPromptModalOpen={setPromptModalOpen} />
        ) : (
          <PromptTable columns={columns} data={prompts} />
        )}
      </div>

      {/* Add/Edit Prompt Modal */}
      <PromptForm
        // open={promptModalOpen}
        // onOpenChange={setPromptModalOpen}
        promptEdited={promptEdited}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected{" "}
              {selectedRows.length === 1 ? "prompt" : "prompts"}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting
                ? "Deleting..."
                : `Delete ${selectedRows.length} ${
                    selectedRows.length === 1 ? "prompt" : "prompts"
                  }`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
