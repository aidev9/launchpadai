"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useAtom } from "jotai";
import {
  editedProductAtom,
  selectedProductAtom,
} from "@/lib/store/product-store";

export default function CreateEditProductPage() {
  const router = useRouter();
  const [editedProduct] = useAtom(editedProductAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [Wizard, setWizard] = useState<React.ComponentType<any> | null>(null);
  const isEditMode = !!editedProduct;

  // Load the wizard component once
  useEffect(() => {
    if (!Wizard) {
      import("@/app/(protected)/welcome/wizard/page")
        .then((module) => setWizard(() => module.default))
        .catch((err) => {
          console.error("Error loading wizard component:", err);
        });
    }
  }, [Wizard]);

  const handleComplete = () => {
    // If a product was just created or edited, navigate to its detail page
    if (selectedProduct) {
      router.push("/myproducts/product");
    } else {
      // Otherwise, go back to products list
      router.push("/myproducts");
    }
  };

  const breadcrumbItems = [
    { label: "My Products", href: "/myproducts" },
    { label: isEditMode ? "Edit Product" : "Create Product" },
  ];

  return (
    <Main>
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Product" : "Create New Product"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update your product details"
              : "Create a brand new product"}
          </p>
        </div>
      </div>

      <div>
        {!Wizard ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Wizard onComplete={handleComplete} />
        )}
      </div>
    </Main>
  );
}
