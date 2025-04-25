"use client";

import { useAtom } from "jotai";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addQAModalOpenAtom,
  deleteQAModalOpenAtom,
  rowSelectionAtom,
  selectedQuestionAtom,
} from "./qa-store";

// interface QAPrimaryButtonsProps {
//   // Removed onRefresh prop
// }

export function QAPrimaryButtons(/* Removed onRefresh prop */) {
  const [rowSelection] = useAtom(rowSelectionAtom);
  const [, setAddModalOpen] = useAtom(addQAModalOpenAtom);
  const [, setDeleteModalOpen] = useAtom(deleteQAModalOpenAtom);
  const [, setSelectedQuestion] = useAtom(selectedQuestionAtom);

  // Count selected rows
  const selectedCount = Object.keys(rowSelection).length;

  const handleDeleteSelected = () => {
    // Clear any selected question to ensure we're in "multiple delete" mode
    setSelectedQuestion(null);
    // Open the delete modal
    setDeleteModalOpen(true);
  };

  return (
    <div className="flex gap-2">
      {selectedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={handleDeleteSelected}
        >
          <Trash className="h-4 w-4" />
          Delete Selected ({selectedCount})
        </Button>
      )}

      <Button
        size="sm"
        className="h-9 gap-1"
        onClick={() => setAddModalOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
