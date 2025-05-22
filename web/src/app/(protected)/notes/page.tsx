"use client";
import { Main } from "@/components/layout/main";
import { useState, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { NoteTable } from "./components/note-table";
import { NotesPrimaryButtons } from "./components/notes-primary-buttons";
import { NotesDialogs } from "./components/notes-dialogs";
import { AlertCircle, PlusIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Note,
  rowSelectionAtom,
  allNotesAtom,
  deleteNoteModalOpenAtom,
  selectedNoteAtom,
  phaseFilterAtom,
  addNoteModalOpenAtom,
  viewModeAtom,
  searchQueryAtom,
} from "./components/notes-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast as showToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseNotes } from "@/lib/firebase/client/FirebaseNotes";
import { FilterBar } from "@/components/ui/components/filter-bar";
import { Phases } from "@/lib/firebase/schema";
import { NoteCard } from "./components/note-card";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

export default function NotesPage() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [phaseFilter] = useAtom(phaseFilterAtom);
  const [searchQuery] = useAtom(searchQueryAtom);
  const [, setNotes] = useAtom(allNotesAtom);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useAtom(
    deleteNoteModalOpenAtom
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNote, setSelectedNote] = useAtom(selectedNoteAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [, setAddNoteModalOpen] = useAtom(addNoteModalOpenAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  // Use react-firebase-hooks to get notes
  const [noteData, isLoading, firestoreError] = useCollectionData(
    selectedProduct
      ? firebaseNotes.getNotesByProduct(selectedProduct.id)
      : null,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include the document ID
  const formattedNotes = React.useMemo(
    () =>
      (noteData || []).map((note) => {
        return {
          ...note,
          id: note.id,
        } as Note;
      }),
    [noteData]
  );

  // Apply phase and search filters
  const filteredNotes = React.useMemo(
    () =>
      formattedNotes.filter((note) => {
        // If no phases are selected, show all notes
        const matchesPhase =
          phaseFilter.length === 0 ||
          (note.phases &&
            note.phases.some((phase) => phaseFilter.includes(phase)));

        // If no search query, show all notes
        const matchesSearch =
          !searchQuery.trim() ||
          note.note_body.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesPhase && matchesSearch;
      }),
    [formattedNotes, phaseFilter, searchQuery]
  );

  // Update notes atom when formattedNotes changes
  React.useEffect(() => {
    setNotes(formattedNotes);
  }, [formattedNotes, setNotes]);

  // Custom function to update selectedRows state that ensures latest state is reflected
  const updateSelectedRows = useCallback((rows: string[]) => {
    setSelectedRows(rows);
  }, []);

  const handleDeleteNotes = async () => {
    if (!selectedRows || selectedRows.length === 0) {
      console.error("No rows selected");
      return;
    }

    // Open the delete confirmation dialog
    setDeleteModalOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setDeleteModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setAddNoteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Determine which note(s) to delete - either the single note from action menu or selected rows
      const noteIdsToDelete = selectedNote
        ? [selectedNote.id]
        : [...selectedRows];

      // Clear selections
      setSelectedRows([]);
      setRowSelection({});
      setDeleteModalOpen(false);
      setSelectedNote(null);

      // Delete notes using FirebaseNotes
      const success = await firebaseNotes.deleteNotes(noteIdsToDelete);

      if (success) {
        showToastHandler({
          title: `${noteIdsToDelete.length} note${
            noteIdsToDelete.length > 1 ? "s" : ""
          } deleted`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        showToastHandler({
          title: "Error deleting notes",
          description: "Failed to delete notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during delete:", error);
      showToastHandler({
        title: "Error deleting notes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  const handleCreateNote = () => {
    setAddNoteModalOpen(true);
  };

  const breadcrumbItems = [{ label: "Notes" }];

  return (
    <>
      <Main>
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Notes</h2>
            <p className="text-muted-foreground">
              Manage your product notes here.
            </p>
          </div>

          <NotesPrimaryButtons
            selectedRows={selectedRows}
            onDelete={handleDeleteNotes}
            selectedProductId={selectedProduct?.id || ""}
            onCreateNote={handleCreateNote}
          />
        </div>

        <div className="mb-6">
          <FilterBar
            mode="notes"
            placeholderText="Filter notes..."
            data-testid="notes-filter-bar"
          />
        </div>

        {firestoreError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{firestoreError.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">No notes found.</p>
            <Button className="mt-4" onClick={handleCreateNote}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onPhaseClick={(phase) => {
                  // TODO: Implement phase filtering
                }}
              />
            ))}
          </div>
        ) : (
          <NoteTable
            data={filteredNotes}
            setSelectedRows={updateSelectedRows}
          />
        )}

        <NotesDialogs
          onSuccess={() => {
            setSelectedNote(null);
            setAddNoteModalOpen(false);
            setDeleteModalOpen(false);
          }}
          onShowToast={showToastHandler}
          onOptimisticAdd={(note) => {
            setNotes((prevNotes) => [note, ...prevNotes]);
          }}
        />
      </Main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {selectedNote
                ? "this note"
                : `${selectedRows.length} ${
                    selectedRows.length === 1 ? "note" : "notes"
                  }`}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
