"use client";

import * as React from "react";
import { Box, ChevronsUpDown, Plus, Compass } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { productsAtom, selectedProductAtom } from "@/lib/store/product-store";
import { useAtom } from "jotai";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import { Phases, Product } from "@/lib/firebase/schema";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";

const ProductSwitcher = React.memo(function ProductSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [products, setProducts] = useAtom(productsAtom);
  const [user, authLoading] = useAuthState(clientAuth);

  // Only create the query if user is authenticated
  const productsQuery = user ? firebaseProducts.getProducts() : null;

  const [firebaseProductsData, isLoading, error] = useCollectionData(
    productsQuery,
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // The only useEffect we need
  useEffect(() => {
    if (firebaseProductsData) {
      const typedProducts = firebaseProductsData.map((p) => p as Product);
      setProducts(typedProducts);
    }
  }, [firebaseProductsData, setProducts]);

  // Update products atom when Firebase data changes
  // useEffect(() => {
  //   console.log("[ProductSwitcher] Auth state:", {
  //     user: !!user,
  //     authLoading,
  //     isLoading,
  //   });
  //   console.log(
  //     "[ProductSwitcher] Firebase products data:",
  //     firebaseProductsData
  //   );

  //   if (firebaseProductsData) {
  //     console.log(
  //       "[ProductSwitcher] Processing products data:",
  //       firebaseProductsData
  //     );
  //     const typedProducts = firebaseProductsData.map((p) => p as Product);
  //     setProducts(typedProducts);
  //   } else if (error) {
  //     console.error("[ProductSwitcher] Firebase error:", error);
  //   }
  // }, [firebaseProductsData, setProducts, error, user, authLoading, isLoading]);

  const phase = selectedProduct?.phases
    ? selectedProduct?.phases[0]
    : Phases.DISCOVER;

  // Handle creating a new product
  const handleCreateProduct = useCallback(() => {
    router.push("/welcome");
  }, [router]);

  // Navigate to the FTUX page
  const handleStartHere = useCallback(() => {
    router.push("/welcome");
  }, [router]);

  // useEffect(() => {
  //   if (selectedProduct) {
  //     const foundProduct = products.find((p) => p.id === selectedProduct.id);
  //     if (foundProduct) {
  //       setSelectedProduct(foundProduct);
  //     }
  //   }
  // }, [selectedProduct, products]);

  if ((isLoading || authLoading) && products.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="opacity-50">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Box className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight max-w-[calc(var(--sidebar-width)_-_6rem)] overflow-hidden">
              <span className="truncate font-semibold">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Show create product if no products or user not authenticated
  if (products.length === 0 && !authLoading && !isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleCreateProduct}
            className="hover:bg-primary/10"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight max-w-[calc(var(--sidebar-width)_-_6rem)] overflow-hidden">
              <span className="truncate font-semibold">Create a Product</span>
              <span className="truncate text-xs">Get started</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Box className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight max-w-[calc(var(--sidebar-width)_-_8rem)] overflow-hidden">
                <span className="truncate font-semibold">
                  {selectedProduct?.name || "Select Product"}
                </span>
                <span className="truncate text-xs">{phase}</span>
              </div>
              <ChevronsUpDown className="ml-auto shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-80 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            style={{ maxWidth: "min(80vw, 20rem)" }}
          >
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={handleStartHere}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-accent shrink-0">
                <Compass className="size-4" />
              </div>
              <div className="font-medium truncate">Start Here</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              My Products
            </DropdownMenuLabel>
            {products.map((product) => (
              <DropdownMenuItem
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border shrink-0">
                  <Box className="size-4 shrink-0" />
                </div>
                <div className="flex-1 truncate max-w-[calc(100%_-_3rem)]">
                  {product.name}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={handleCreateProduct}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background shrink-0">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground truncate">
                New Product
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});

export { ProductSwitcher };
