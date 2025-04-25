"use client";

import { useEffect, useRef, useState } from "react";
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

  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // Debug performance
  useEffect(() => {
    renderCount.current += 1;
    console.log(
      `[ProductPage] Render #${renderCount.current}, time since mount: ${Date.now() - mountTime.current}ms`
    );
    console.log(
      `[ProductPage] Current product: ${selectedProduct?.name || "none"}`
    );
    console.log(
      `[ProductPage] Current product ID: ${selectedProductId || "none"}`
    );

    return () => {
      console.log("[ProductPage] Page unmounting");
    };
  }, [selectedProduct, selectedProductId]);

  // Improved logic to handle product initialization
  useEffect(() => {
    const initializeProduct = async () => {
      // Skip if product is already loaded
      if (selectedProduct) {
        console.log(
          "[ProductPage] Product already loaded:",
          selectedProduct.name
        );
        return;
      }

      // Skip if we're already loading
      if (isLoading) {
        return;
      }

      // If we have an ID but no product data, try to load it
      if (selectedProductId) {
        setIsLoading(true);
        console.log(
          `[ProductPage] Initializing from localStorage ID: ${selectedProductId}`
        );

        try {
          // Try to load the product from the ID
          await selectProduct(selectedProductId);

          // If we still don't have a product after attempting to load, redirect to dashboard
          if (!selectedProduct && loadAttempts >= 2) {
            console.log(
              "[ProductPage] Failed to load product, redirecting to dashboard"
            );
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
        console.log(
          "[ProductPage] No product ID in localStorage, redirecting to dashboard"
        );
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
