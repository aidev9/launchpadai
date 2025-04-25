"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Provider, createStore } from "jotai";
import { useEffect, useState, useCallback } from "react";
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
import { toast as showToast } from "@/hooks/use-toast";

// Replace direct server function calls with API fetches
async function fetchNotes(productId: string) {
  const res = await fetch(`/api/notes?productId=${productId}`);
  if (!res.ok) {
    console.error(`Error fetching notes: ${res.status} ${res.statusText}`);
    // Optionally throw an error or return a specific error object
    throw new Error(`Failed to fetch notes: ${res.statusText}`);
  }
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

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

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
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom function to update selectedRows state that ensures latest state is reflected
  const updateSelectedRows = useCallback((rows: string[]) => {
    setSelectedRows(rows);
  }, []);

  const loadNotes = useCallback(async () => {
    if (!selectedProductId) {
      return;
    }
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
    }
  }, [selectedProductId, store]);

  // Debounced version of loadNotes to prevent rapid UI changes
  // const debouncedLoadNotes = useDebounce(loadNotes, 300);

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
        // Use the handler function instead of calling toast directly
        showToastHandler({
          title: `${noteIdsToDelete.length} note${noteIdsToDelete.length > 1 ? "s" : ""} deleted`,
          // description: "Successfully removed from the system.", // Optional: Add description if desired
          duration: 5000,
        });
        // No need to reload the entire list since we already updated the UI
      } else {
        // Use the handler for error toast too
        showToastHandler({
          title: "Error deleting notes",
          description: response.error || "Failed to delete notes",
          variant: "destructive",
        });
        loadNotes(); // Reload on error
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
      loadNotes();
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

  return (
    <Provider store={store}>
      <Header fixed>
        <div className="flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="py-24 px-4">
        {selectedProductId ? (
          <>
            <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
              <div className="flex-1">
                <Breadcrumbs items={breadcrumbItems} className="mb-4" />
                <h2 className="text-2xl font-bold tracking-tight">
                  {productName} - Notes
                </h2>
                <p className="text-muted-foreground">Manage your notes here.</p>
              </div>
              <div className="flex items-start mt-6 md:mt-0">
                <NotesPrimaryButtons
                  selectedProductId={selectedProductId}
                  onDelete={handleDeleteNotes}
                  selectedRows={selectedRows}
                />
              </div>
            </div>

            <div className="flex-grow overflow-auto">
              <NoteTable data={notes} setSelectedRows={updateSelectedRows} />
            </div>

            <NotesDialogs
              onSuccess={loadNotes}
              onOptimisticAdd={handleNoteAdded}
              onShowToast={showToastHandler}
            />
          </>
        ) : (
          renderProductSelector()
        )}
      </Main>

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
