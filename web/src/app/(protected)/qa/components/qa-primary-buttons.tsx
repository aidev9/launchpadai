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
    // Log the selected question IDs (now actual document IDs thanks to getRowId)
    const selectedIds = Object.keys(rowSelection);

    // Clear any selected question to ensure we're in "multiple delete" mode
    setSelectedQuestion(null);
    // Open the delete modal
    setDeleteModalOpen(true);
  };

  return (
    <div className="flex gap-2">
      {selectedCount > 0 && (
        <Button variant="destructive" onClick={handleDeleteSelected}>
          <Trash className="h-4 w-4" />
          Delete Selected
        </Button>
      )}

      <Button onClick={() => setAddModalOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
