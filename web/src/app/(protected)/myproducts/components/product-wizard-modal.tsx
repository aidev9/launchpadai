"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { editedProductAtom } from "@/lib/store/product-store";

// Create a simpler component that directly loads the wizard
export default function ProductWizardModal({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const editedProduct = useAtomValue(editedProductAtom);
  const [Wizard, setWizard] = useState<React.ComponentType<any> | null>(null);
  const productRef = useRef(editedProduct);

  // Store the product in a ref to ensure it's available even if the atom changes
  useEffect(() => {
    if (editedProduct) {
      productRef.current = editedProduct;
    }
  }, [editedProduct]);

  // Load the wizard component once
  useEffect(() => {
    if (!Wizard) {
      import("@/app/(protected)/welcome/wizard/page")
        .then((module) => setWizard(() => module.default))
        .catch((err) => {
          // Silently handle error
        });
    }
  }, [Wizard]);

  const handleComplete = () => {
    onComplete();
  };

  // Show loading while we're waiting for the wizard
  if (!Wizard) {
    return (
      <div className="product-wizard-modal">
        <div className="p-8">Loading wizard...</div>
      </div>
    );
  }

  return (
    <div className="product-wizard-modal">
      <div data-modal-mode="true" className="w-full">
        <Wizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
