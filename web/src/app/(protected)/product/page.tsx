"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { ProductDashboard } from "./product";
import { useAtom } from "jotai";
import {
  selectedProductAtom,
  selectedProductIdAtom,
} from "@/lib/store/product-store";
import { useProducts } from "@/hooks/useProducts";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function ProductPage() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const { selectProduct } = useProducts();
  const router = useRouter();

  // Track loading attempts
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Improved logic to handle product initialization
  useEffect(() => {
    const initializeProduct = async () => {
      // Skip if product is already loaded
      if (selectedProduct) {
        return;
      }

      // Skip if we're already loading
      if (isLoading) {
        return;
      }

      // If we have an ID but no product data, try to load it
      if (selectedProductId) {
        setIsLoading(true);

        try {
          // Try to load the product from the ID
          await selectProduct(selectedProductId);

          // If we still don't have a product after attempting to load, redirect to dashboard
          if (!selectedProduct && loadAttempts >= 2) {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("[ProductPage] Error loading product:", error);
          // Redirect on error
          router.push("/dashboard");
        } finally {
          setIsLoading(false);
          setLoadAttempts((prev) => prev + 1);
        }
      } else {
        // No product ID available, redirect to dashboard
        router.push("/dashboard");
      }
    };

    initializeProduct();
  }, [
    selectedProductId,
    selectedProduct,
    selectProduct,
    router,
    isLoading,
    loadAttempts,
  ]);

  return (
    <Main>
      <ProductDashboard />
    </Main>
  );
}
