"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
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

  // Try to load the product if we have an ID but no product data
  useEffect(() => {
    const loadProduct = async () => {
      // If we have an ID but no product data, try to load it
      if (
        selectedProductId &&
        !selectedProduct &&
        !isLoading &&
        loadAttempts < 3
      ) {
        setIsLoading(true);
        console.log(
          `[ProductPage] Attempting to load product ID: ${selectedProductId}`
        );

        try {
          // Try to load the product from the ID
          await selectProduct(selectedProductId);
          setLoadAttempts((prev) => prev + 1);
        } catch (error) {
          console.error("[ProductPage] Error loading product:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProduct();
  }, [
    selectedProductId,
    selectedProduct,
    selectProduct,
    loadAttempts,
    isLoading,
  ]);

  // After sufficient load attempts, redirect if still no product
  useEffect(() => {
    // Only redirect after we've tried loading a few times
    if (loadAttempts >= 3 && !selectedProduct) {
      console.log(
        "[ProductPage] No product selected after multiple attempts, redirecting to dashboard"
      );
      router.push("/dashboard");
    }
  }, [selectedProduct, router, loadAttempts]);

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <ProductDashboard />
      </Main>
    </>
  );
}
