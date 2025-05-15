"use client";
import { Main } from "@/components/layout/main";
import { useState, useCallback, useEffect, use } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { toast } from "@/components/ui/use-toast";
import { useFetchProducts } from "@/hooks/useFetchProducts";
import { NoteTable } from "./components/note-table";
import { NotesPrimaryButtons } from "./components/notes-primary-buttons";
import { NotesDialogs } from "./components/notes-dialogs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Note,
  rowSelectionAtom,
  allNotesAtom,
  deleteNoteModalOpenAtom,
  selectedNoteAtom,
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
import { fetchNotes, deleteNotes } from "./actions";
import { clientAuth } from "@/lib/firebase/client";

const userId = clientAuth.currentUser?.uid;

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

export default function NotesPage() {
  const { products, productsLoading } = useFetchProducts();
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [notes, setNotes] = useAtom(allNotesAtom);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useAtom(
    deleteNoteModalOpenAtom
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNote, setSelectedNote] = useAtom(selectedNoteAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [isLoading, setIsLoading] = useState(false);

  // Custom function to update selectedRows state that ensures latest state is reflected
  const updateSelectedRows = useCallback((rows: string[]) => {
    setSelectedRows(rows);
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      setSelectedRows([]); // Clear selected rows when loading new notes

      try {
        const response = await fetchNotes({
          productId: selectedProductId,
        });

        if (response.success && response.notes) {
          setNotes(response.notes);
          setIsLoading(false);
        } else {
          toast({
            title: "Error loading notes",
            description: response.error || "Failed to load notes",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } catch (error) {
        toast({
          title: "Error loading notes",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    };

    if (selectedProductId) {
      loadNotes();
    }
  }, [selectedProductId]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleDeleteNotes = async () => {
    if (!selectedProductId) {
      console.error("No product selected");
      return;
    }

    if (!selectedRows || selectedRows.length === 0) {
      console.error("No rows selected");
      return;
    }

    // Open the delete confirmation dialog
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Determine which note(s) to delete - either the single note from action menu or selected rows
      const noteIdsToDelete = selectedNote
        ? [selectedNote.id]
        : [...selectedRows];

      // Optimistic update - remove selected notes from UI immediately
      const updatedNotes = notes.filter(
        (note) => !noteIdsToDelete.includes(note.id)
      );
      setNotes(updatedNotes);

      // Clear selections
      setSelectedRows([]);
      setRowSelection({});
      setDeleteModalOpen(false);
      setSelectedNote(null);

      // Create FormData for the server action
      const formData = new FormData();
      formData.append("productId", selectedProductId ?? "");
      formData.append("noteIds", JSON.stringify(noteIdsToDelete));

      // Call the server action
      const response = await deleteNotes(formData);

      if (response.success) {
        // Use the handler function instead of calling toast directly
        showToastHandler({
          title: `${noteIdsToDelete.length} note${noteIdsToDelete.length > 1 ? "s" : ""} deleted`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        // Use the handler for error toast too
        showToastHandler({
          title: "Error deleting notes",
          description: response.error || "Failed to delete notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during delete API call:", error);
      // Use the handler for general error toast
      showToastHandler({
        title: "Error deleting notes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      // Reload notes to ensure UI is in sync with server state
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  const renderProductSelector = () => (
    <Card className="w-full max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Select a Product</CardTitle>
        <CardDescription>
          Please select a product to view and manage its notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {productsLoading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <select
            className="w-full border rounded p-2"
            value={selectedProductId || ""}
            onChange={(e) => handleProductChange(e.target.value)}
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No products found</AlertTitle>
            <AlertDescription>
              No products were found in your account. Please create a product
              first.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const breadcrumbItems = [{ label: "Notes" }];

  // Get the selected product name
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productName = selectedProduct?.name || "Notes";

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Main>
        <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
          <div className="flex-1">
            <Breadcrumbs items={breadcrumbItems} className="mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">
              {productName} - Notes
            </h2>
            <p className="text-muted-foreground">Manage your notes here.</p>
          </div>
          <div className="flex items-start mt-6 md:mt-0">
            {selectedProductId && (
              <NotesPrimaryButtons
                selectedRows={selectedRows}
                onDelete={handleDeleteNotes}
                selectedProductId={selectedProductId}
              />
            )}
          </div>
        </div>

        <div className="flex-grow overflow-auto">
          <NoteTable
            data={selectedProductId ? notes : []}
            setSelectedRows={updateSelectedRows}
          />
        </div>
      </Main>

      <NotesDialogs
        onSuccess={() => {
          // Use the existing note atom instead of fetching all notes again
          if (selectedProductId) {
            // No need to make another API call, the optimistic updates and atom state
            // should already handle the table refresh
            // This will trigger a re-render of the table without additional data fetching
          }
        }}
        onOptimisticAdd={(note: Note) => {
          setNotes((prevNotes) => [note, ...prevNotes]);
        }}
        onShowToast={showToastHandler}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Notes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {selectedNote
                ? "this note"
                : `${selectedRows.length} note${selectedRows.length > 1 ? "s" : ""}`}
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
