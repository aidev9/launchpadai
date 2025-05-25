"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { ProductDashboard } from "./product";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function ProductPage() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const router = useRouter();

  // Redirect if no product is selected
  useEffect(() => {
    if (!selectedProduct) {
      router.push("/dashboard");
    }
  }, [selectedProduct, router]);

  return (
    <Main>
      <ProductDashboard />
    </Main>
  );
}
