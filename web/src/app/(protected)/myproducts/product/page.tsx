"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useAtom } from "jotai";
import {
  selectedProductIdAtom,
  selectedProductAtom,
} from "@/lib/store/product-store";
import { featureWizardStateAtom } from "@/lib/store/feature-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getProduct } from "@/lib/firebase/products";
import { Product } from "@/lib/firebase/schema";
import { Badge } from "@/components/ui/badge";
import { Pencil, FileText, Puzzle, Layers } from "lucide-react";

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [, setSelectedProduct] = useAtom(selectedProductAtom);
  const [, setFeatureWizardState] = useAtom(featureWizardStateAtom);

  // Get the product ID from the Jotai atom

  // Handle edit product
  const handleEditProduct = () => {
    if (selectedProductId) {
      // Store the product ID in Jotai atom
      // setSelectedProductId(selectedProductId);
      router.push("/myproducts/edit");
    }
  };

  // Handle navigate to questions
  const handleNavigateToQuestions = () => {
    if (selectedProductId) {
      // Store the product ID in Jotai atom
      // setSelectedProductId(selectedProductId);
      router.push("/myproducts/product/questions");
    }
  };

  // Handle navigate to assets
  const handleNavigateToAssets = () => {
    if (selectedProductId) {
      // Store the product ID in Jotai atom
      // setSelectedProductId(selectedProductId);
      router.push("/myproducts/product/assets");
    }
  };

  // Handle navigate to features
  const handleNavigateToFeatures = () => {
    if (selectedProductId) {
      // Update feature wizard state with the product ID
      setFeatureWizardState((state) => ({
        ...state,
        productId: selectedProductId,
      }));
      router.push("/myproducts/product/features");
    }
  };

  return (
    <Main>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "My Products", href: "/dashboard" },
                  {
                    label: product?.name || "Product Details",
                    href: "",
                    isCurrentPage: true,
                  },
                ]}
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {product?.name}
                </h1>
                {product?.stage && (
                  <Badge variant="outline">{product.stage}</Badge>
                )}
              </div>
              <div>
                <Button variant="outline" onClick={handleEditProduct}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="whitespace-pre-wrap">{product?.description}</p>
                </div>
                {product?.problem && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Problem Statement
                    </h3>
                    <p className="whitespace-pre-wrap">{product.problem}</p>
                  </div>
                )}
                {product?.team && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Team
                    </h3>
                    <p>{product.team}</p>
                  </div>
                )}
                {product?.website && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Website
                    </h3>
                    <a
                      href={product.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {product.website}
                    </a>
                  </div>
                )}
                {product?.country && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Country
                    </h3>
                    <p>{product.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleNavigateToQuestions}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Questions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleNavigateToAssets}
                  >
                    <Layers className="mr-2 h-4 w-4" /> Assets
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleNavigateToFeatures}
                  >
                    <Puzzle className="mr-2 h-4 w-4" /> Features
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </Main>
  );
}
