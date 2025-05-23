"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useAtom, useSetAtom } from "jotai";
import { Feedback } from "@/lib/firebase/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  selectedFeedbackAtom,
  feedbackActionAtom,
} from "@/lib/store/feedback-store";
import { Eye, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteFeedback } from "@/hooks/useFeedback";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface DataTableRowActionsProps {
  row: Row<Feedback>;
  onRespond: (feedback: Feedback) => void;
}

export function DataTableRowActions({
  row,
  onRespond,
}: DataTableRowActionsProps) {
  const feedback = row.original;

  const setSelectedFeedback = useSetAtom(selectedFeedbackAtom);
  const [, setFeedbackAction] = useAtom(feedbackActionAtom);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const deleteMutation = useDeleteFeedback();

  const handleView = () => {
    // Set the selected feedback in the atom
    setSelectedFeedback(feedback);
    // Here you could navigate to a detail view if needed
  };

  const handleRespond = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    onRespond(feedback);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    // Make sure the event doesn't bubble up to the row click handler
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    try {
      setIsDeleting(true);
      const result = await deleteMutation.mutateAsync(feedback.id);

      if (result.success) {
        // Close the dialog
        setDeleteDialogOpen(false);

        // Dispatch a targeted delete action
        setFeedbackAction({
          type: "DELETE",
          feedbackId: feedback.id,
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: `Failed to delete feedback: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRespond}>
            <MessageSquare className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Respond
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          // When closing the dialog, prevent row click events
          if (!open) {
            // Using setTimeout to ensure this executes after the current event cycle
            setTimeout(() => setDeleteDialogOpen(false), 0);
          } else {
            setDeleteDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => handleDelete(e)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
