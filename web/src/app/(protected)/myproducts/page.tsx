"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Main } from "@/components/layout/main";
import { useAtom } from "jotai";
import {
  selectedProductAtom,
  productRowSelectionAtom,
  deleteProductAtom,
  deleteMultipleProductsAtom,
  productViewModeAtom,
  editedProductAtom,
  productPhaseFilterAtom,
  productSearchQueryAtom,
} from "@/lib/store/product-store";
import { Plus, Trash } from "lucide-react";
import { Product, Phases } from "@/lib/firebase/schema";
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
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { ProductCard } from "./components/product-card";
import { ProductTable } from "./components/product-table";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FilterBar } from "@/components/ui/components/filter-bar";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  ProductGridSkeleton,
  ProductTableSkeleton,
} from "./components/product-skeleton";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyProducts() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView] = useAtom(productViewModeAtom);
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [editedProduct, setEditedProduct] = useAtom(editedProductAtom);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseFilter] = useAtom(productPhaseFilterAtom);
  const [searchQuery] = useAtom(productSearchQueryAtom);

  // Row selection state
  const [rowSelection, setRowSelection] = useAtom(productRowSelectionAtom);
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  // Optimistic UI updates
  const deleteProductAtomFn = useAtom(deleteProductAtom)[1];
  const deleteMultipleProductsAtomFn = useAtom(deleteMultipleProductsAtom)[1];

  // Use react-firebase-hooks to get products directly
  const [productsData, isLoading, firestoreError] = useCollectionData(
    phaseFilter.length > 0
      ? firebaseProducts.getProductsByPhase(phaseFilter as Phases[])
      : firebaseProducts.getProducts(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include the document ID
  const products = (productsData || []).map((product) => ({
    ...product,
    id: product.id,
  })) as Product[];

  // Apply search filter
  const filteredProducts =
    searchQuery.trim() === ""
      ? products
      : products.filter((product) => {
          const query = searchQuery.toLowerCase();
          return (
            product.name?.toLowerCase().includes(query) ||
            (product.description || "").toLowerCase().includes(query)
          );
        });

  // Reset any filters when the page loads - do this only once
  useEffect(() => {
    // Clear filters and selection on mount
    setRowSelection({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProduct = () => {
    setEditedProduct(null);
    router.push("/myproducts/create");
  };

  const handleProductClick = async (product: Product) => {
    // First set the product in the atom
    setSelectedProduct(product);

    // Small delay to ensure the atom is updated
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Then navigate
    router.push("/myproducts/product");
  };

  const handleEditProduct = (product: Product) => {
    // First set the product in the atom
    setEditedProduct(product);

    // Small delay to ensure the atom is updated
    setTimeout(() => {
      router.push("/myproducts/create");
    }, 0);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsSubmitting(true);
    try {
      const result = await firebaseProducts.deleteProduct(productToDelete.id);
      if (result.success) {
        // Optimistically update UI
        deleteProductAtomFn(productToDelete);

        toast({
          title: "Success",
          description: "Product deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });

        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMultipleProducts = async () => {
    setIsSubmitting(true);
    try {
      // Now rowSelection directly contains product IDs as keys
      const selectedIds = Object.keys(rowSelection);

      if (selectedIds.length === 0) {
        toast({
          title: "Error",
          description: "No products selected for deletion",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const result = await firebaseProducts.deleteMultipleProducts(selectedIds);

      if (result.success) {
        // Optimistically update UI
        deleteMultipleProductsAtomFn(selectedIds);

        toast({
          title: "Success",
          description: `Successfully deleted ${result.deletedCount} products`,
          duration: TOAST_DEFAULT_DURATION,
        });

        setIsMultipleDeleteDialogOpen(false);
        setRowSelection({});
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete products",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in confirmDeleteMultipleProducts:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const error = firestoreError ? firestoreError.message : null;
  const breadcrumbItems = [{ label: "My Products" }];
  return (
    <Main>
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">My Products</h2>
          <p className="text-muted-foreground">Manage your products here.</p>
        </div>

        <div className="flex items-center gap-4">
          {hasSelectedRows && (
            <Button
              variant="destructive"
              onClick={() => {
                setIsMultipleDeleteDialogOpen(true);
              }}
              data-testid="delete-selected-products"
            >
              <Trash className="h-4 w-4" />
              Delete Selected
            </Button>
          )}
          <Button onClick={handleCreateProduct} data-testid="create-product">
            <Plus className="h-4 w-4" />
            Create New Product
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <FilterBar
          mode="products"
          placeholderText="Filter products..."
          data-testid="product-filter-bar"
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          layoutView === "grid" ? (
            <ProductGridSkeleton />
          ) : (
            <ProductTableSkeleton />
          )
        ) : error ? (
          <ErrorDisplay
            error={firestoreError}
            title="Product rockets are offline!"
            message="Our product loading system hit some space debris. Mission control is working on it!"
            onRetry={() => window.location.reload()}
            retryText="Retry Launch"
            component="MyProducts"
            action="loading_products"
            metadata={{ phaseFilter, searchQuery }}
          />
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters, or create a new product
            </p>
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Create a new product
            </Button>
          </div>
        ) : layoutView === "grid" ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="product-card-grid"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <ProductTable
            data={filteredProducts}
            onClick={handleProductClick}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product
              <span className="font-semibold">
                {productToDelete && ` "${productToDelete.name}"`}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Multiple Delete Confirmation Dialog */}
      <AlertDialog
        open={isMultipleDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsMultipleDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {Object.keys(rowSelection).length} selected products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMultipleProducts}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
