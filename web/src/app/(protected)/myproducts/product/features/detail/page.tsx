"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { Pencil } from "lucide-react";
import {
  selectedFeatureAtom,
  featureWizardStateAtom,
} from "@/lib/store/feature-store";
import {
  selectedProductIdAtom,
  selectedProductAtom,
} from "@/lib/store/product-store";
import { getProduct } from "@/lib/firebase/products";
import { Feature, Product } from "@/lib/firebase/schema";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrdDownload } from "./components/prd-download";
import { AiPlayground } from "./components/ai-playground";

export default function FeatureDetailPage() {
  const [feature, setFeature] = useAtom(selectedFeatureAtom);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [featureWizardState, setFeatureWizardState] = useAtom(
    featureWizardStateAtom
  );

  // Get the product ID from Jotai atoms
  const productId = featureWizardState.productId || selectedProductId;

  // Load product details when the component mounts
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!feature?.id) {
        toast({
          title: "Error",
          description:
            "No feature selected. Please select a feature from the features list.",
          variant: "destructive",
        });
        router.push("/myproducts/product/features");
        return;
      }

      setIsLoading(true);
      try {
        // Fetch the product details if we have a product ID
        if (productId) {
          const productResult = await getProduct(productId);
          if (productResult.success && productResult.product) {
            setProduct(productResult.product as Product);
          }
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

    loadProductDetails();
  }, [feature?.id, productId, toast, router]);

  // Handle edit feature
  const handleEditFeature = () => {
    if (feature?.id && productId) {
      // Update feature wizard state with all feature data
      setFeatureWizardState({
        productId: productId,
        name: feature.name || "",
        description: feature.description || "",
        status: feature.status || "Under Development",
        tags: feature.tags || [],
      });
      router.push("/myproducts/product/features/create");
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Under Development":
        return "bg-blue-100 text-blue-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                    label: "Product",
                    href: "/product",
                  },
                  {
                    label: "Features",
                    href: "/myproducts/product/features",
                  },
                  {
                    label: feature?.name || "Feature Details",
                    href: "",
                    isCurrentPage: true,
                  },
                ]}
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {feature?.name}
                </h1>
                {feature?.status && (
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleEditFeature}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature details */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Feature Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Product
                  </h3>
                  <p>{product?.name || "Unknown Product"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="whitespace-pre-wrap">{feature?.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {feature?.tags && feature.tags.length > 0 ? (
                      feature.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No tags</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRD and AI Playground */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Product Requirements Document</CardTitle>
                <CardDescription>
                  View and enhance your feature's PRD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="prd" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="prd">PRD</TabsTrigger>
                    <TabsTrigger value="ai-playground">
                      AI Playground
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="prd" className="mt-4">
                    <div className="flex justify-end mb-4">
                      <PrdDownload />
                    </div>
                    <div className="prose max-w-none">
                      {feature?.prdContent ? (
                        <div className="whitespace-pre-wrap font-mono text-sm">
                          {feature.prdContent}
                        </div>
                      ) : (
                        <p>
                          The PRD for this feature will be generated based on
                          the feature details. Click the "Download PRD" button
                          to download the PRD as a Markdown file.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="ai-playground" className="mt-4">
                    <AiPlayground />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Main>
  );
}
