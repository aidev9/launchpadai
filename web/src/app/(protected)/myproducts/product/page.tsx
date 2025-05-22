"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { ProductDashboard } from "@/app/(protected)/product/product";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function ProductPage() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const router = useRouter();

  useEffect(() => {
    // If no product is selected in the store, redirect back
    if (!selectedProduct) {
      router.push("/myproducts");
    }
  }, [selectedProduct, router]);

  // Show loading state while checking the product
  if (!selectedProduct) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <ProductDashboard />
    </Main>
  );
}
