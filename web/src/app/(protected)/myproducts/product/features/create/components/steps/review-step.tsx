"use client";

import { useAtom } from "jotai";
import {
  featureWizardStateAtom,
  isEditModeAtom,
} from "@/lib/store/feature-store";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getProduct } from "@/lib/firebase/products";
import { Product } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";

interface ReviewStepProps {
  onSubmit: () => void;
}

export function ReviewStep({ onSubmit }: ReviewStepProps) {
  const [wizardState] = useAtom(featureWizardStateAtom);
  const [isEditMode] = useAtom(isEditModeAtom);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!wizardState.productId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getProduct(wizardState.productId);
        if (result.success && result.product) {
          setProductDetails(result.product as Product);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load product details",
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

    fetchProductDetails();
  }, [wizardState.productId, toast]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4 border-t border-t-slate-200 pt-4">
          {/* Product */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Product
            </h3>
            <p className="text-sm">
              {productDetails?.name || "Unknown Product"}
            </p>
          </div>

          {/* Feature Name */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Feature Name
            </h3>
            <p className="text-sm">{wizardState.name}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">
              {wizardState.description}
            </p>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">
              Status
            </h3>
            <div className="mt-1">
              <Badge
                variant={
                  wizardState.status === "Active"
                    ? "default"
                    : wizardState.status === "Inactive"
                      ? "secondary"
                      : wizardState.status === "Draft"
                        ? "outline"
                        : "outline"
                }
              >
                {wizardState.status}
              </Badge>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {wizardState.tags.length > 0 ? (
                wizardState.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No tags</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
