"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { Plus, Grid, List } from "lucide-react";
import {
  featureViewModeAtom,
  selectedFeatureIdAtom,
  selectedFeatureAtom,
  featureTableRowSelectionAtom,
  featureWizardStateAtom,
} from "@/lib/store/feature-store";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { getProductFeatures } from "@/lib/firebase/features";
import { Feature } from "@/lib/firebase/schema";
import { FeatureDataTable } from "./components/feature-data-table";
import { FeatureGrid } from "./components/feature-grid";

export default function FeaturesPage() {
  const [viewMode, setViewMode] = useAtom(featureViewModeAtom);
  const [, setSelectedFeatureId] = useAtom(selectedFeatureIdAtom);
  const [, setSelectedFeature] = useAtom(selectedFeatureAtom);
  const [rowSelection, setRowSelection] = useAtom(featureTableRowSelectionAtom);
  const [featureWizardState] = useAtom(featureWizardStateAtom);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Get the product ID from Jotai atoms
  const productId = featureWizardState.productId || selectedProductId;

  // Load features when the component mounts
  useEffect(() => {
    const loadFeatures = async () => {
      if (!productId) {
        toast({
          title: "Error",
          description: "Product ID is missing",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const result = await getProductFeatures(productId);
        if (result.success) {
          setFeatures(result.features || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load features",
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

    loadFeatures();
  }, [productId, toast]);

  // Load saved view mode preference from localStorage on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem("featureViewMode");
    if (savedViewMode === "grid" || savedViewMode === "table") {
      setViewMode(savedViewMode);
    }
  }, [setViewMode]);

  // Save view mode preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("featureViewMode", viewMode);
  }, [viewMode]);

  // Handle view feature
  const handleViewFeature = (feature: Feature) => {
    // Store both the feature ID and the feature object in Jotai atoms
    setSelectedFeatureId(feature.id ?? null);
    setSelectedFeature(feature);
    router.push("/myproducts/product/features/detail");
  };

  // Handle edit feature
  const handleEditFeature = (feature: Feature) => {
    // Store both the feature ID and the feature object in Jotai atoms
    setSelectedFeatureId(feature.id ?? null);
    setSelectedFeature(feature);
    router.push("/myproducts/product/features/create");
  };

  // Handle delete feature
  const handleDeleteFeature = async (feature: Feature) => {
    // This will be implemented later
    console.log("Delete feature", feature);
  };

  // Handle create feature
  const handleCreateFeature = () => {
    router.push("/myproducts/product/features/create");
  };

  return (
    <Main>
      <div className="mb-8">
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "My Products", href: "/dashboard" },
              { label: "Product", href: "/product" },
              {
                label: "Features",
                href: "",
                isCurrentPage: true,
              },
            ]}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Features</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleCreateFeature}>
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <FeatureDataTable
              data={features}
              onViewFeature={handleViewFeature}
              onEditFeature={handleEditFeature}
              onDeleteFeature={handleDeleteFeature}
            />
          ) : (
            <FeatureGrid
              features={features}
              onViewFeature={handleViewFeature}
              onEditFeature={handleEditFeature}
              onDeleteFeature={handleDeleteFeature}
            />
          )}
        </>
      )}
    </Main>
  );
}
