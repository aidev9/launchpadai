"use client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import React from "react";
import { useAtom } from "jotai";
import { addNoteModalOpenAtom } from "./notes-store";

interface NotesPrimaryButtonsProps {
  onRefresh?: () => void;
  onDelete: () => void;
  selectedRows: string[];
  selectedProductId: string | null | undefined;
}

function NotesPrimaryButtonsComponent({
  onDelete,
  selectedRows,
  selectedProductId,
}: NotesPrimaryButtonsProps) {
  const [_, setAddNoteModalOpen] = useAtom(addNoteModalOpenAtom);

  // Calculate whether the button should be disabled
  const isDeleteDisabled = !selectedRows || selectedRows.length === 0;
  const isAddNoteDisabled = !selectedProductId;

  // Debug log to verify prop values
  React.useEffect(() => {
    console.log("Delete Button Props:", { selectedRows, isDeleteDisabled });
  }, [selectedRows, isDeleteDisabled]);

  const handleDelete = () => {
    console.log("Delete button clicked, selectedRows:", selectedRows);
    onDelete();
  };

  const handleAddNote = () => {
    setAddNoteModalOpen(true);
  };

  return (
    <div className="flex gap-2">
      {/* Only render delete button when there are rows selected */}
      {selectedRows.length > 0 && (
        <Button
          onClick={handleDelete}
          className="h-9 gap-2 bg-red-500 hover:bg-red-600 text-white"
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected
        </Button>
      )}

      <Button
        onClick={handleAddNote}
        size="sm"
        className="h-9 gap-1"
        disabled={isAddNoteDisabled}
      >
        <Plus className="h-4 w-4" /> Add Note
      </Button>
    </div>
  );
}

// Export the component as NotesPrimaryButtons
export const NotesPrimaryButtons = memo(NotesPrimaryButtonsComponent);
