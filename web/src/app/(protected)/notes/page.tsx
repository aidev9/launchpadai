"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Provider, createStore } from "jotai";
import { useEffect, useState, useCallback, useRef } from "react";
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
import { Note, rowSelectionAtom } from "./components/notes-store";
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

// Debounce function to prevent rapid API calls
function useDebounce(fn: Function, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}

// Replace direct server function calls with API fetches
async function fetchNotes(productId: string) {
  const res = await fetch(`/api/notes?productId=${productId}`);
  return await res.json();
}

async function deleteNotes(productId: string, noteIds: string[]) {
  if (noteIds.length === 0) return { success: true };

  const res = await fetch(`/api/notes`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, noteIds }),
  });
  return await res.json();
}

export default function NotesPage() {
  // Create a fresh store for the notes page to avoid sharing state between pages
  const store = React.useMemo(() => {
    const newStore = createStore();
    newStore.set(rowSelectionAtom, {});
    return newStore;
  }, []);

  const { products, productsLoading } = useFetchProducts();
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom function to update selectedRows state that ensures latest state is reflected
  const updateSelectedRows = useCallback((rows: string[]) => {
    setSelectedRows(rows);
  }, []);

  const loadNotes = useCallback(async () => {
    if (!selectedProductId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSelectedRows([]); // Clear selected rows when loading new notes
    store.set(rowSelectionAtom, {}); // Also clear the row selection in the store
    try {
      const response = await fetchNotes(selectedProductId);
      if (response.success && response.notes) {
        setNotes(response.notes);
      } else {
        toast({
          title: "Error loading notes",
          description: response.error || "Failed to load notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading notes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProductId, store]);

  // Debounced version of loadNotes to prevent rapid UI changes
  const debouncedLoadNotes = useDebounce(loadNotes, 300);

  // Add a function for optimistic updates when adding new notes
  const handleNoteAdded = useCallback((newNote: Note) => {
    // Add the new note to the top of the list
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Type guard to ensure selectedProductId is not null
      if (!selectedProductId) {
        throw new Error("No product selected");
      }

      // Optimistic update - remove selected notes from UI immediately
      const noteIdsToDelete = [...selectedRows];
      const updatedNotes = notes.filter(
        (note) => !noteIdsToDelete.includes(note.id)
      );
      setNotes(updatedNotes);
      setSelectedRows([]);
      store.set(rowSelectionAtom, {});
      setDeleteDialogOpen(false);

      // Actually perform the deletion on the server
      const response = await deleteNotes(selectedProductId, noteIdsToDelete);

      if (response.success) {
        toast({
          title: `${noteIdsToDelete.length} note${noteIdsToDelete.length > 1 ? "s" : ""} deleted`,
        });
        // No need to reload the entire list since we already updated the UI
      } else {
        // If there's an error, reload the notes to ensure UI and server are in sync
        toast({
          title: "Error deleting notes",
          description: response.error || "Failed to delete notes",
          variant: "destructive",
        });
        loadNotes();
      }
    } catch (error) {
      console.error("Error during delete API call:", error);
      toast({
        title: "Error deleting notes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      // Reload notes to ensure UI is in sync with server state
      loadNotes();
    } finally {
      setIsDeleting(false);
    }
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

  return (
    <Provider store={store}>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>
      <Main className="container mx-auto py-6 mt-14 px-4">
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        {!selectedProductId ? (
          renderProductSelector()
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {productName} - Notes
                </h2>
                <p className="text-muted-foreground">Manage your notes here.</p>
              </div>
              <div className="flex items-center">
                <NotesPrimaryButtons
                  onDelete={handleDeleteNotes}
                  selectedRows={selectedRows}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-4">
                <div className="rounded-md">
                  {isLoading ? (
                    <div className="h-[300px] flex justify-center items-center">
                      <div className="animate-pulse text-muted-foreground">
                        Loading notes...
                      </div>
                    </div>
                  ) : (
                    <NoteTable
                      data={notes}
                      setSelectedRows={updateSelectedRows}
                      selectedRows={selectedRows}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </Main>
      <NotesDialogs onSuccess={loadNotes} onOptimisticAdd={handleNoteAdded} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Notes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRows.length} note
              {selectedRows.length > 1 ? "s" : ""}? This action cannot be
              undone.
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
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Provider>
  );
}
