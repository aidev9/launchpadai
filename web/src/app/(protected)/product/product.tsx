"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Building,
  ArrowUpRight,
  MessageSquare,
  FileSearch,
  Download,
  ChevronRight,
} from "lucide-react";
import { deleteProduct } from "@/lib/firebase/products";
import { useAtom } from "jotai";
import {
  selectedProductIdAtom,
  selectedProductAtom,
} from "@/lib/store/product-store";
import { useProducts } from "@/hooks/useProducts";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Static color mapping function - outside component to avoid recreation
const getStageColor = (stage: string) => {
  const stageColors: Record<string, string> = {
    Discover: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Validate: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    Design: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    Build: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    Secure: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    Launch: "bg-green-500/10 text-green-500 border-green-500/20",
    Grow: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    stageColors[stage] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  );
};

// Static date formatting function - outside component
const formatCreatedDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Text trimming utility
const trimText = (text: string, maxLength: number = 150) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Collapsible text component
function CollapsibleText({ text, label }: { text: string; label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const maxLength = 150;
  const needsTrimming = text && text.length > maxLength;

  if (!needsTrimming)
    return (
      <div>
        {label && (
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </h3>
        )}
        <p>{text}</p>
      </div>
    );

  return (
    <div>
      {label && (
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </h3>
      )}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div>
          <p>{isOpen ? text : trimText(text, maxLength)}</p>
          <CollapsibleTrigger asChild>
            <Button
              variant="link"
              className="px-0 h-auto font-normal text-xs text-blue-500"
            >
              {isOpen ? "Show less" : "Read more..."}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {/* This is empty as we're showing the full text in the main paragraph when open */}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ProductDashboard() {
  // All hooks must be called at the top level and in the same order for every render
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Use Jotai atoms and the optimized hook
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const { isLoading, selectProduct } = useProducts();

  // Performance tracking ref - no conditional rules
  const mountTime = useRef(Date.now());

  // Ensure product data is loaded when ID changes
  useEffect(() => {
    if (
      selectedProductId &&
      (!selectedProduct || selectedProduct.id !== selectedProductId)
    ) {
      console.log(
        `[ProductDashboard] Loading product data for ID: ${selectedProductId}`
      );
      selectProduct(selectedProductId);
    }
  }, [selectedProductId, selectedProduct, selectProduct]);

  // Track render count for debugging - no conditional rules
  useEffect(() => {
    console.log(
      `[ProductDashboard] Render time since mount: ${Date.now() - mountTime.current}ms`
    );

    return () => {
      console.log("[ProductDashboard] Component unmounting");
    };
  }, [selectedProductId]); // Add selectedProductId to trigger re-render when it changes

  const handleEdit = () => {
    if (selectedProduct) {
      router.push(`/welcome/wizard?edit=${selectedProduct.id}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(selectedProduct.id);
      if (result.success) {
        // Clear localStorage when product is deleted
        localStorage.removeItem("selectedProductId");

        setOpenConfirmDialog(false);
        router.push("/dashboard");
      } else {
        console.error("Failed to delete product:", result.error);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigation handlers
  const navigateToAnswerQuestions = () => {
    router.push("/answer_questions");
  };

  const navigateToReviewAssets = () => {
    router.push("/review_assets");
  };

  const navigateToDownloadAssets = () => {
    router.push("/download_assets");
  };

  // Handle product not found - return early
  if (!selectedProductId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Building className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Product Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a product from the dashboard to get started.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Loading state - return early
  if (isLoading || !selectedProduct) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-6">
        <div className="h-8 w-2/3 bg-muted rounded"></div>
        <div className="h-4 w-1/2 bg-muted rounded"></div>
        <div className="h-32 w-full bg-muted rounded mt-4"></div>
      </div>
    );
  }

  // Selected product view
  return (
    <div className="space-y-6">
      {/* Navigation and header section with responsive layout */}
      <div className="flex flex-col space-y-4">
        {/* Replace the Back button with Breadcrumbs */}
        {selectedProduct && (
          <Breadcrumbs
            items={[
              { label: "Products", href: "/dashboard" },
              {
                label: selectedProduct.name,
                href: `/product`,
                isCurrentPage: true,
              },
            ]}
          />
        )}

        {/* Action buttons - now in their own row for mobile, will be hidden on desktop */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedProduct.name}"? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title and badges in a responsive container */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedProduct.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={getStageColor(selectedProduct.stage)}
              >
                {selectedProduct.stage}
              </Badge>
              {selectedProduct.template_type &&
                selectedProduct.template_type !== "blank" && (
                  <Badge variant="outline">
                    {selectedProduct.template_type.charAt(0).toUpperCase() +
                      selectedProduct.template_type.slice(1)}
                  </Badge>
                )}
            </div>
          </div>

          {/* Action buttons for desktop - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Dialog
              open={openConfirmDialog}
              onOpenChange={setOpenConfirmDialog}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Product</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{selectedProduct.name}"?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpenConfirmDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProduct.description && (
              <CollapsibleText
                text={selectedProduct.description}
                label="Description"
              />
            )}
            {selectedProduct.problem && (
              <CollapsibleText
                text={selectedProduct.problem}
                label="Problem Statement"
              />
            )}
            {selectedProduct.team && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Team
                </h3>
                <p>{selectedProduct.team}</p>
              </div>
            )}
            {selectedProduct.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Website
                </h3>
                <p>
                  <a
                    href={selectedProduct.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {selectedProduct.website}
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </a>
                </p>
              </div>
            )}
            {selectedProduct.country && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Country
                </h3>
                <p>{selectedProduct.country}</p>
              </div>
            )}
            {selectedProduct.createdAt && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </h3>
                <p>{formatCreatedDate(selectedProduct.createdAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Steps</CardTitle>
            <p className="text-muted-foreground text-sm">
              Continue building your product
            </p>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3">
            <div
              onClick={navigateToAnswerQuestions}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">
                    Answer Questions
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Get AI-powered insights
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            </div>

            <div
              onClick={navigateToReviewAssets}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <FileSearch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">
                    Review Assets
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Browse product materials
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            </div>

            <div
              onClick={navigateToDownloadAssets}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">
                    Download Assets
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Get all files and documents
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
