"use client";

import { useEffect, useRef } from "react";
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

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function ProductPage() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const router = useRouter();
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // Debug performance
  useEffect(() => {
    renderCount.current += 1;
    console.log(
      `[ProductPage] Render #${renderCount.current}, time since mount: ${Date.now() - mountTime.current}ms`
    );
    console.log(`[ProductPage] Current product: ${selectedProduct?.name}`);

    return () => {
      console.log("[ProductPage] Page unmounting");
    };
  }, [selectedProduct]);

  // Redirect to dashboard if no product is selected
  useEffect(() => {
    if (!selectedProduct) {
      console.log(
        "[ProductPage] No product selected, redirecting to dashboard"
      );
      router.push("/dashboard");
    }
  }, [selectedProduct, router]);

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
