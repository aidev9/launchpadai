"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { featureWizardStateAtom } from "@/lib/store/feature-store";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/firebase/schema";
import { getAllProducts } from "@/lib/firebase/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProductStep() {
  const [wizardState, setWizardState] = useAtom(featureWizardStateAtom);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localProductId, setLocalProductId] = useState(
    wizardState.productId || ""
  );
  const { toast } = useToast();

  // Load products when the component mounts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getAllProducts();
        if (result.success) {
          setProducts((result.products as Product[]) || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load products",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [toast]);

  // Track if component has mounted
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after initial render
  useEffect(() => {
    setIsMounted(true);
    // No dependencies - runs only once after mount
  }, []);

  // Update atom only when navigating away or unmounting
  useEffect(() => {
    return () => {
      // Only update the atom when unmounting
      if (localProductId !== wizardState.productId) {
        setWizardState({
          ...wizardState,
          productId: localProductId,
        });
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>
          Product <span className="text-red-500">*</span>
        </Label>
        {isLoading ? (
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {products.length === 0 ? (
              <div className="col-span-full text-center p-4 border rounded-md text-muted-foreground">
                No products found
              </div>
            ) : (
              products.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all ${
                    localProductId === product.id
                      ? "border-primary border-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setLocalProductId(product.id)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {product.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Select the product this feature belongs to.
        </p>
      </div>
    </div>
  );
}
