"use client";

import { useState } from "react";
import { useAllFeedback, useBulkDeleteFeedback } from "@/hooks/useFeedback";
import { columns } from "./components/feedback-columns";
import { FeedbackTable } from "./components/feedback-table";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
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
import { useAtom } from "jotai";
import { rowSelectionAtom } from "@/lib/store/feedback-store";
import { RespondDialog } from "./components/respond-dialog";
import { Feedback } from "@/lib/firebase/schema";

export default function FeedbackPage() {
  const { data: feedback = [], isLoading } = useAllFeedback();
  const bulkDeleteMutation = useBulkDeleteFeedback();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);

  // Get selected feedback IDs
  const selectedRowIndexes = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  );
  const hasSelectedItems = selectedRowIndexes.length > 0;

  // Handle deleting selected feedback
  const handleDeleteSelected = async () => {
    // Map row indexes to actual feedback IDs
    const selectedFeedbackIds = selectedRowIndexes
      .map((index) => {
        const numericIndex = parseInt(index, 10);
        return feedback[numericIndex]?.id;
      })
      .filter(Boolean) as string[];

    await bulkDeleteMutation.mutateAsync(selectedFeedbackIds);
    setRowSelection({});
    setDeleteDialogOpen(false);
  };

  // Handle opening respond dialog
  const handleOpenRespondDialog = (feedbackItem: Feedback) => {
    setSelectedFeedback(feedbackItem);
    setRespondDialogOpen(true);
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Feedback", href: "", isCurrentPage: true },
        ]}
      />

      <div className="mt-8 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feedback</h2>
          <p className="text-muted-foreground">
            Manage user feedback, bug reports, and contact requests
          </p>
        </div>
        {feedback.length > 0 && hasSelectedItems && (
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={bulkDeleteMutation.isPending}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        )}
      </div>

      <div className="-mx-4 mt-4 flex-1 overflow-auto px-4 py-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading feedback...</p>
          </div>
        ) : feedback.length > 0 ? (
          <FeedbackTable
            columns={columns}
            data={feedback}
            onRespond={handleOpenRespondDialog}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRowIndexes.length}{" "}
              selected {selectedRowIndexes.length === 1 ? "item" : "items"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSelected();
              }}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Respond dialog */}
      <RespondDialog
        feedback={selectedFeedback}
        open={respondDialogOpen}
        onOpenChange={setRespondDialogOpen}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h3 className="text-lg font-medium">No feedback yet</h3>
      <p className="text-muted-foreground mt-1">
        When users submit feedback, it will appear here.
      </p>
    </div>
  );
}
