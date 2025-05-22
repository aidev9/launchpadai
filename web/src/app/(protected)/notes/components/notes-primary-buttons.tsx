"use client";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { memo } from "react";
import React from "react";
import { useAtom } from "jotai";
import { addNoteModalOpenAtom } from "./notes-store";
import { selectedProductAtom } from "@/lib/store/product-store";

interface NotesPrimaryButtonsProps {
  selectedRows: string[];
  onDelete: () => void;
  selectedProductId: string | null;
  onCreateNote: () => void;
}

function NotesPrimaryButtonsComponent({
  selectedRows,
  onDelete,
  onCreateNote,
}: NotesPrimaryButtonsProps) {
  const [_, setAddNoteModalOpen] = useAtom(addNoteModalOpenAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);

  const handleDelete = () => {
    console.log("Delete button clicked, selectedRows:", selectedRows);
    onDelete();
  };

  const handleAddNote = () => {
    setAddNoteModalOpen(true);
  };

  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="flex gap-2">
      {hasSelectedRows && (
        <Button
          variant="destructive"
          onClick={handleDelete}
          data-testid="delete-notes-button"
        >
          <Trash className="h-4 w-4" />
          Delete Selected
        </Button>
      )}
      <Button
        onClick={onCreateNote}
        disabled={!selectedProduct}
        data-testid="add-note-button"
      >
        <Plus className="h-4 w-4" />
        Add Note
      </Button>
    </div>
  );
}

export const NotesPrimaryButtons = memo(NotesPrimaryButtonsComponent);
