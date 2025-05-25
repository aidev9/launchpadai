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
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

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
        <Card className="p-6 border-t border-t-slate-200">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div>
              <Skeleton className="h-5 w-28 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4 mt-1" />
            </div>
            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-7 w-24" />
            </div>
            <div>
              <Skeleton className="h-5 w-12 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          </div>
        </Card>
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
