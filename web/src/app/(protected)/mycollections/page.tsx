"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useState } from "react";
import { useAtom } from "jotai";
import {
  collectionViewModeAtom,
  collectionRowSelectionAtom,
  collectionModalOpenAtom,
  isEditingCollectionAtom,
  selectedCollectionAtom,
  collectionPhaseFilterAtom,
  collectionSearchQueryAtom,
} from "@/lib/store/collection-store";
import { useToast } from "@/hooks/use-toast";
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
import { Collection, CollectionStatus, Product } from "@/lib/firebase/schema";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import {
  deleteCollectionAction,
  deleteMultipleCollectionsAction,
} from "./actions";
import { CollectionForm } from "./components/collection-form";
import { ErrorDisplay } from "@/components/ui/error-display";
import { CollectionCard } from "./components/collection-card";
import { CollectionTable } from "./components/collection-table";
import { productsAtom, selectedProductAtom } from "@/lib/store/product-store";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { firebaseCollections } from "@/lib/firebase/client/FirebaseCollections";
import { FilterBar } from "@/components/ui/components/filter-bar";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyCollections() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView, setLayoutView] = useAtom(collectionViewModeAtom);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useAtom(
    collectionModalOpenAtom
  );
  const [isEditing, setIsEditing] = useAtom(isEditingCollectionAtom);
  const [selectedCollection, setSelectedCollection] = useAtom(
    selectedCollectionAtom
  );

  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<Collection | null>(null);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Row selection state
  const [rowSelection, setRowSelection] = useAtom(collectionRowSelectionAtom);
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  // Filter states - use atoms for FilterBar compatibility
  const [phaseFilter, setPhaseFilter] = useAtom(collectionPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(collectionSearchQueryAtom);
  const [statusFilter, setStatusFilter] = useState<CollectionStatus[]>([]);
  const [products, setProducts] = useAtom(productsAtom);

  // Use useCollectionData hook to get the collections for the selected product
  const [collections, collectionsLoading, collectionsError] = useCollectionData(
    selectedProduct
      ? firebaseCollections.getCollectionsByProduct(selectedProduct.id)
      : null,
    {
      snapshotListenOptions: {
        includeMetadataChanges: true,
      },
    }
  );

  // Safely cast data to proper type with null handling
  const typedCollections: Collection[] = (collections as Collection[]) || [];

  // Apply filters - collections is already an array of objects, not a snapshot
  const filteredCollections = typedCollections.filter((collection) => {
    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collection.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Apply phase filter
    const matchesPhase =
      phaseFilter.length === 0 ||
      collection.phaseTags.some((tag: string) => phaseFilter.includes(tag));

    // Apply status filter
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(collection.status);

    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Handle product selection
  const handleProductChange = (productId: string | null) => {
    if (productId) {
      const product = products.find((c) => c.id === productId)?.id || null;
      setSelectedProduct(product ? ({ id: product } as Product) : null);
    } else {
      setSelectedProduct(null);
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    router.push("/mycollections/collection");
  };

  const handleCreateCollection = () => {
    setIsEditing(false);
    setSelectedCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    if (!collection || !collection.id) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: "Cannot edit collection - missing collection data",
        variant: "destructive",
      });
      return;
    }

    setSelectedCollection(collection);
    setIsEditing(true);
    setIsCollectionModalOpen(true);
  };

  const handleDeleteCollection = (collection: Collection) => {
    if (!collection || !collection.id) {
      toast({
        title: "Error",
        description: "Cannot delete collection - missing collection ID",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    setCollectionToDelete(collection);
    setIsDeleteDialogOpen(true);
  };

  const handleTagClick = (tag: string) => {
    if (!phaseFilter.includes(tag)) {
      setPhaseFilter([...phaseFilter, tag]);
    }
  };

  const handleStatusClick = (status: CollectionStatus) => {
    if (!statusFilter.includes(status)) {
      setStatusFilter([...statusFilter, status]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete || !collectionToDelete.id) return;

    try {
      setIsSubmitting(true);
      const result = await deleteCollectionAction(collectionToDelete.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Collection deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete collection",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCollectionToDelete(null);
      setIsSubmitting(false);
    }
  };

  // Function to handle multiple delete
  const handleDeleteSelected = () => {
    // Open confirmation dialog
    setIsMultipleDeleteDialogOpen(true);
  };

  // Function to execute multiple delete after confirmation
  const executeMultipleDelete = async () => {
    try {
      setIsSubmitting(true);

      // Get selected collections from the table data
      const selectedCollectionIds = typedCollections
        .filter((_, index) => rowSelection[index])
        .map((collection) => collection.id)
        .filter(Boolean);

      if (selectedCollectionIds.length === 0) {
        setIsMultipleDeleteDialogOpen(false);
        return;
      }

      // Call server action to delete multiple collections
      const result = await deleteMultipleCollectionsAction(
        selectedCollectionIds
      );

      if (result.success) {
        // Reset row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Collections deleted",
          description: `Successfully deleted ${result.deletedCount} collection${
            result.deletedCount === 1 ? "" : "s"
          }`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete collections",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsMultipleDeleteDialogOpen(false);
      setIsSubmitting(false);
    }
  };

  if (collectionsError) {
    return (
      <Main>
        <ErrorDisplay
          error={collectionsError}
          title="Collection rockets are offline!"
          message="Our collection loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Retry Launch"
          component="MyCollections"
          action="loading_collections"
          metadata={{ productId: selectedProduct?.id }}
        />
      </Main>
    );
  }

  return (
    <Main data-testid="mycollections-page">
      <Breadcrumbs
        className="mb-4"
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "My Collections", isCurrentPage: true },
        ]}
      />
      <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">My Collections</h2>
          <p className="text-muted-foreground">
            Manage your knowledgebase here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasSelectedRows && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isSubmitting}
              className="h-9"
            >
              <Trash className="h-4 w-4" /> Delete Selected
            </Button>
          )}
          <Button
            onClick={handleCreateCollection}
            data-testid="create-collection-button"
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>New Collection</span>
          </Button>
        </div>
      </div>

      <div>
        {/* Filter and Search row */}
        <div className="space-y-4">
          {/* StatusFilter */}
          {/* <StatusFilter
            selectedStatuses={statusFilter}
            onChange={setStatusFilter}
          /> */}

          {/* FilterBar for phase filtering and search */}
          <FilterBar
            mode="collections"
            placeholderText="Filter collections..."
            data-testid="collection-filter-bar"
          />
        </div>
      </div>

      {collectionsError && (
        <ErrorDisplay
          error={collectionsError}
          title="Collection data rockets are malfunctioning!"
          message="Our collection loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Reload Collections"
          className="border rounded-lg mt-4"
          component="MyCollections"
          action="loading_collections_list"
          metadata={{ productId: selectedProduct?.id }}
        />
      )}

      <div className="mt-6">
        {collectionsLoading ? (
          layoutView === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <Skeleton className="h-16 mb-2" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="p-8 flex items-center justify-center">
                <Skeleton className="h-6 w-full max-w-xl" />
              </div>
            </div>
          )
        ) : (
          <>
            {filteredCollections.length === 0 ? (
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">
                  No collections found
                </h2>
                <p className="text-muted-foreground mb-6">
                  {typedCollections.length === 0
                    ? "You haven't created any collections yet"
                    : "No collections match your search criteria"}
                </p>
                <Button onClick={handleCreateCollection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Collection
                </Button>
              </div>
            ) : layoutView === "grid" ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                data-testid="collection-card-grid"
              >
                {filteredCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => handleCollectionClick(collection)}
                    onEdit={() => handleEditCollection(collection)}
                    onDelete={() => handleDeleteCollection(collection)}
                    onTagClick={handleTagClick}
                    onStatusClick={handleStatusClick}
                  />
                ))}
              </div>
            ) : (
              <CollectionTable
                data={filteredCollections}
                onClick={handleCollectionClick}
                onEdit={handleEditCollection}
                onDelete={handleDeleteCollection}
                onTagClick={handleTagClick}
                onStatusClick={handleStatusClick}
              />
            )}
          </>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the collection &quot;
              {collectionToDelete?.title}&quot; and all its documents. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isMultipleDeleteDialogOpen}
        onOpenChange={setIsMultipleDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple collections?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {Object.keys(rowSelection).length}{" "}
              selected collection
              {Object.keys(rowSelection).length === 1 ? "" : "s"} and all their
              documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeMultipleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CollectionForm />
    </Main>
  );
}
