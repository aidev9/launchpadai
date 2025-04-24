"use client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import React from "react";

interface NotesPrimaryButtonsProps {
  onRefresh?: () => void;
  onDelete: () => void;
  selectedRows: string[];
}

function NotesPrimaryButtonsComponent({
  onDelete,
  selectedRows,
}: NotesPrimaryButtonsProps) {
  // Calculate whether the button should be disabled
  const isDeleteDisabled = !selectedRows || selectedRows.length === 0;

  // Debug log to verify prop values
  React.useEffect(() => {
    console.log("Delete Button Props:", { selectedRows, isDeleteDisabled });
  }, [selectedRows, isDeleteDisabled]);

  const handleDelete = () => {
    console.log("Delete button clicked, selectedRows:", selectedRows);
    onDelete();
  };

  return (
    <div className="flex gap-2">
      {/* Only render delete button when there are rows selected */}
      {selectedRows.length > 0 && (
        <Button
          onClick={handleDelete}
          variant="outline"
          size="sm"
          className="h-9 gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected ({selectedRows.length})
        </Button>
      )}

      <Button
        onClick={() =>
          window.dispatchEvent(new CustomEvent("open-add-note-dialog"))
        }
        size="sm"
        className="h-9 gap-1"
      >
        <Plus className="h-4 w-4" /> Add Note
      </Button>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export const NotesPrimaryButtons = memo(
  NotesPrimaryButtonsComponent,
  (prevProps, nextProps) => {
    // Log the comparison
    console.log("NotesPrimaryButtons memo comparison:", {
      prevRows: prevProps.selectedRows,
      nextRows: nextProps.selectedRows,
      equal:
        JSON.stringify(prevProps.selectedRows) ===
        JSON.stringify(nextProps.selectedRows),
    });

    // Only re-render when selectedRows actually changes
    return (
      JSON.stringify(prevProps.selectedRows) ===
      JSON.stringify(nextProps.selectedRows)
    );
  }
);
