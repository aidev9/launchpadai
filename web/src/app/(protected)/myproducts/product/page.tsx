"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { ProductDashboard } from "@/app/(protected)/product/product";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "../components/product-skeleton";

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
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <ProductGridSkeleton />
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
