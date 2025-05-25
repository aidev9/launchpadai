"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PopoverProps } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  selectedProductAtom,
  selectedProductIdAtom,
  productsAtom,
} from "@/lib/store/product-store";
import { Product } from "@/lib/firebase/schema";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import { useAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { ErrorDisplay } from "@/components/ui/error-display";

interface ProductSelectorProps extends PopoverProps {}

export function ProductSelector({ ...props }: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [products, setProducts] = useAtom(productsAtom);
  const [user, authLoading] = useAuthState(clientAuth);
  const router = useRouter();

  // Only create the query if user is authenticated
  const productsQuery = user ? firebaseProducts.getProducts() : null;

  const [firebaseProductsData, isLoading, error] = useCollectionData(
    productsQuery,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Sync Firebase data to products atom
  React.useEffect(() => {
    if (firebaseProductsData) {
      const typedProducts = firebaseProductsData.map((p) => p as Product);
      setProducts(typedProducts);
    }
  }, [firebaseProductsData, setProducts]);

  // Helper functions
  const selectProduct = React.useCallback(
    async (productId: string) => {
      setSelectedProductId(productId);
      const product = products?.find((p) => p.id === productId) as Product;
      if (product) {
        setSelectedProduct(product);
      }
    },
    [products, setSelectedProductId, setSelectedProduct]
  );

  const clearProductSelection = React.useCallback(() => {
    setSelectedProductId(null);
    setSelectedProduct(null);
  }, [setSelectedProductId, setSelectedProduct]);

  // Track whether product selection is in progress
  const [selectionInProgress, setSelectionInProgress] = React.useState(false);

  // Use effect to monitor selection completion
  React.useEffect(() => {
    if (selectionInProgress && selectedProduct?.id === selectedProductId) {
      setSelectionInProgress(false);
      setOpen(false);
    }
  }, [selectionInProgress, selectedProduct, selectedProductId]);

  const handleSelectProduct = async (product: Product) => {
    // Set selection in progress and store product id for verification
    setSelectionInProgress(true);
    setSelectedProductId(product.id);

    // Call the selectProduct function to store in localStorage and update the atom
    await selectProduct(product.id);
  };

  const handleDeselectProduct = () => {
    clearProductSelection();
    setOpen(false);
  };

  const handleAddNewProduct = () => {
    router.push("/welcome");
    setOpen(false);
  };

  // Handle Firebase errors
  if (error) {
    return (
      <div className="flex-1 md:max-w-[200px] lg:max-w-[300px]">
        <ErrorDisplay
          error={error}
          title="Product rockets are offline!"
          message="Our product loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Retry Launch"
          component="ProductSelector"
          action="loading_products"
          className="border rounded-lg p-4"
        />
      </div>
    );
  }

  // Show loading state
  if ((isLoading || authLoading) && products.length === 0) {
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-label="Loading products..."
        className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px] opacity-50"
        disabled
      >
        Loading products...
        <ChevronsUpDown className="opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Select a product..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedProduct ? selectedProduct.name : "Select a product..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup heading="Products">
              {products?.map((product) => {
                return (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelectProduct(product)}
                  >
                    {product.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {selectedProduct && (
                <CommandItem
                  onSelect={handleDeselectProduct}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Deselect product
                </CommandItem>
              )}
              <CommandItem
                onSelect={handleAddNewProduct}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new product
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
