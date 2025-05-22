"use client";

import { useState } from "react";
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
  ArrowUpRight,
  MessageSquare,
  FileSearch,
  Download,
  ChevronRight,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import { useAtom } from "jotai";
import {
  selectedProductAtom,
  editedProductAtom,
  deleteProductAtom,
  productsAtom,
} from "@/lib/store/product-store";
import { featureWizardStateAtom } from "@/lib/store/feature-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatTimestamp } from "@/utils/constants";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

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

// Text trimming utility
const trimText = (text: string, maxLength: number = 150) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Collapsible text component
function CollapsibleText({
  text,
  label,
  className,
}: {
  text: string | undefined;
  label?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const maxLength = 150;
  const needsTrimming = text && text.length > maxLength;

  if (!text) return null;

  if (!needsTrimming)
    return (
      <div>
        {label && (
          <h3
            className={`text-sm font-medium text-muted-foreground mb-1 ${className}`}
          >
            {label}
          </h3>
        )}
        <p>{text}</p>
      </div>
    );

  return (
    <div>
      {label && (
        <h3
          className={`text-sm font-medium text-muted-foreground mb-1 ${className}`}
        >
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
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Use Jotai atoms
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [products] = useAtom(productsAtom);
  const [featureWizardState, setFeatureWizardState] = useAtom(
    featureWizardStateAtom
  );
  const [, setEditedProduct] = useAtom(editedProductAtom);
  const deleteProductAtomFn = useAtom(deleteProductAtom)[1];

  // If no product is selected, redirect back to products list
  if (!selectedProduct) {
    router.push("/myproducts");
    return null;
  }

  const handleEdit = () => {
    // Set the current product as the one being edited
    setEditedProduct(selectedProduct);
    // Navigate to the create/edit page
    router.push("/myproducts/create");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await firebaseProducts.deleteProduct(selectedProduct.id);
      if (result.success) {
        // Optimistically update UI
        deleteProductAtomFn(selectedProduct);

        // Find the next product to select
        if (products.length > 1) {
          // Find the index of the current product
          const currentIndex = products.findIndex(
            (p) => p.id === selectedProduct.id
          );

          // Get the next product, or the previous if we're at the end
          const nextIndex =
            currentIndex < products.length - 1
              ? currentIndex + 1
              : currentIndex - 1;

          // Set the next product (this will already exclude the deleted one due to the deleteProductAtomFn call)
          // Filter out the deleted product first
          const remainingProducts = products.filter(
            (p) => p.id !== selectedProduct.id
          );
          setSelectedProduct(
            remainingProducts.length > 0 ? remainingProducts[0] : null
          );
        } else {
          // No more products left after deletion
          setSelectedProduct(null);
        }

        toast({
          title: "Success",
          description: "Product deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });

        setOpenConfirmDialog(false);
        router.push("/myproducts");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
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

  const navigateToFeatures = () => {
    // Update the feature wizard state with the current product ID
    setFeatureWizardState({
      ...featureWizardState,
      productId: selectedProduct.id,
    });
    router.push("/myproducts/product/features");
  };

  // Selected product view
  return (
    <div className="space-y-6">
      {/* Navigation and header section with responsive layout */}
      <div className="flex flex-col space-y-4">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Products", href: "/myproducts" },
            {
              label: selectedProduct.name,
              href: "",
              isCurrentPage: true,
            },
          ]}
        />

        {/* Action buttons - now in their own row for mobile, will be hidden on desktop */}
        <div className="flex flex-wrap gap-2 md:hidden">
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => setOpenConfirmDialog(true)}
            variant="outline"
            size="sm"
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Product header with title and actions */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedProduct.name}
            </h1>
            <Badge
              variant="outline"
              className={`${getStageColor("Discovery")} flex items-center gap-2`}
            >
              {/* {selectedProduct.phases[0]} */}
              Discover
            </Badge>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden md:flex gap-2">
            <Button onClick={handleEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setOpenConfirmDialog(true)}
              variant="outline"
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CollapsibleText
              text={selectedProduct.description}
              label="Description"
              className="text-sm"
            />
            {selectedProduct.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Website
                </h3>
                <a
                  href={selectedProduct.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center text-sm"
                >
                  {selectedProduct.website}
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h3>
              <p className="text-sm">
                {formatTimestamp(selectedProduct.createdAt || Date.now())}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Last Updated
              </h3>
              <p className="text-xs">
                {formatTimestamp(
                  selectedProduct.updatedAt ||
                    selectedProduct.createdAt ||
                    Date.now()
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <p className="text-muted-foreground">
              Continue building your product
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={navigateToAnswerQuestions}
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
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={navigateToReviewAssets}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <FileSearch className="h-4 w-4 text-purple-500" />
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
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={navigateToDownloadAssets}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Download className="h-4 w-4 text-green-500" />
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
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <div
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={navigateToFeatures}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Plus className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">
                    Add Features
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Manage product features
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              product and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenConfirmDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
