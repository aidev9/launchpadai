"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Main } from "@/components/layout/main";
import { useAtom } from "jotai";
import { productFilterAtom } from "@/lib/store/product-store";
import {
  Plus,
  Building,
  Search as SearchIcon,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/lib/firebase/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProduct } from "@/lib/firebase/products";
import { toast as showToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const {
    products,
    isLoading,
    fetchProducts,
    selectedProduct,
    setSelectedProduct,
    setSelectedProductId,
    clearProductSelection,
  } = useProducts();
  const [filterQuery, setFilterQuery] = useAtom(productFilterAtom);
  const router = useRouter();

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add a ref to track initial load state
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // This is a one-time manual refresh that can be triggered if needed
    // for example after creating a new product and returning to this page
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      // Do any additional setup here if needed
    }
  }, []);

  const handleCreateProduct = () => {
    router.push("/welcome");
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
    router.push("/product");
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    router.push(`/welcome/wizard?edit=${product.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToDelete(product);
    setOpenConfirmDialog(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        showToast({
          title: "Product Deleted",
          duration: TOAST_DEFAULT_DURATION,
          description: `Successfully deleted "${productToDelete.name}".`,
          variant: "default",
        });

        if (productToDelete.id === selectedProduct?.id) {
          clearProductSelection();
        }
        await fetchProducts(true);
        setOpenConfirmDialog(false);
      } else {
        console.error("Failed to delete product:", result.error);
        showToast({
          title: "Error Deleting Product",
          duration: TOAST_DEFAULT_DURATION,
          description: result.error || "Could not delete the product.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast({
        title: "Error Deleting Product",
        duration: TOAST_DEFAULT_DURATION,
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get stage color for badge
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "idea":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "pre-seed":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      case "seed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "series a":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "series b":
        return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      case "series c+":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <Main>
        <div className="flex flex-col gap-4 animate-pulse p-6">
          <div className="h-8 w-2/3 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="h-32 w-full bg-muted rounded mt-4"></div>
        </div>
      </Main>
    );
  }

  // No products at all - show welcome screen
  if (products.length === 0) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center max-w-md">
            <Building className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Welcome to Your Dashboard
            </h2>
            <p className="text-muted-foreground mb-6">
              Create a new product to get started.
            </p>
            <Button onClick={handleCreateProduct}>Create New Product</Button>
          </div>
        </div>
      </Main>
    );
  }

  // Filter products based on search query
  const filteredProducts = filterQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          (product.description &&
            product.description
              .toLowerCase()
              .includes(filterQuery.toLowerCase())) ||
          product.stage.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : products;

  // Products list
  return (
    <Main>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Products</h1>
          <Button onClick={handleCreateProduct} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create New Product
          </Button>
        </div>

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter products..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => handleSelectProduct(product)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-xl truncate pr-2">
                    {product.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleEditProduct(e, product)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleDeleteClick(e, product)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {product.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={getStageColor(product.stage)}
                  >
                    {product.stage}
                  </Badge>
                  {product.template_type &&
                    product.template_type !== "blank" && (
                      <Badge variant="outline">
                        {product.template_type.charAt(0).toUpperCase() +
                          product.template_type.slice(1)}
                      </Badge>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Main>
  );
}
