"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
import InsufficientCreditsAlert from "@/components/prompt-credits/insufficient-credits-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import our components
import { AssetForm } from "./components/asset-form";
import { TechStackGeneral } from "./components/tabs/TechStackGeneral";
import { TechStackAssets } from "./components/tabs/TechStackAssets";

// Import our hooks
import { useTechStackAssets } from "./hooks/useTechStackAssets";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import {
  selectedTechStackAtom,
  techStackWizardStateAtom,
  isEditModeAtom,
  currentWizardStepAtom,
} from "@/lib/store/techstack-store";
import { deleteTechStack } from "@/lib/firebase/techstacks";
import { Skeleton } from "@/components/ui/skeleton";

export default function TechStackDetailPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Use the tech stack atoms directly
  const [selectedTechStack] = useAtom(selectedTechStackAtom);
  const [isEditMode, setIsEditMode] = useAtom(isEditModeAtom);
  const [currentStep, setCurrentStep] = useAtom(currentWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);

  // Use our tech stack assets hook without passing techStackId
  const {
    assets,
    selectedAsset,
    setSelectedAsset,
    isLoading,
    error,
    isGenerating,
    generatingAssets,
    activeTab,
    setActiveTab,
    hasInsufficientCredits,
    generateAsset,
  } = useTechStackAssets();

  // Local UI state
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssetDeleteDialogOpen, setIsAssetDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    router.push("/mystacks");
  };

  // Handle tech stack edit
  const handleEdit = () => {
    if (selectedTechStack?.id) {
      // Set wizard state from the selected tech stack
      setWizardState(selectedTechStack);
      // Set edit mode to true
      setIsEditMode(true);
      // Reset to first step of wizard
      setCurrentStep(1);
      // Navigate to create page
      router.push(`/mystacks/create`);
    }
  };

  // Handle tech stack delete
  const handleDelete = async () => {
    if (!selectedTechStack?.id) return;

    try {
      const result = await deleteTechStack(selectedTechStack.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Tech stack deleted successfully",
        });
        router.push("/mystacks");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tech stack",
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
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle asset creation
  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setIsAssetDialogOpen(true);
  };

  // Handle asset edit
  const handleEditAsset = (asset: any) => {
    setSelectedAsset(asset);
    setIsAssetDialogOpen(true);
  };

  // Handle asset save
  const handleSaveAsset = async (assetData: any) => {
    // Implementation will be added later
    setIsAssetDialogOpen(false);
  };

  // Handle asset delete
  const handleDeleteAsset = (asset: any) => {
    setAssetToDelete(asset);
    setIsAssetDeleteDialogOpen(true);
  };

  // Confirm asset delete
  const confirmDeleteAsset = async () => {
    // Implementation will be added later
    setIsAssetDeleteDialogOpen(false);
  };

  // Handle asset generation
  const handleGenerateContent = async (asset: any, instructions?: string) => {
    if (!selectedTechStack) return;

    try {
      console.log("Page: Starting generateAsset call");
      await generateAsset({
        assetId: asset.id,
        assetType: asset.assetType,
        techStackDetails: selectedTechStack,
        userInstructions: instructions,
      });
      console.log("Page: generateAsset completed");
    } catch (error) {
      console.error("Page: Error in handleGenerateContent:", error);
      // Error handling is done in the hook
    }
  };

  // Handle asset copy
  const handleCopyAsset = (asset: any) => {
    // Implementation will be added later
  };

  // Handle asset download
  const handleDownloadAsset = (asset: any) => {
    // Implementation will be added later
  };

  // Handle all assets download
  const handleDownloadAssets = () => {
    // Implementation will be added later
  };

  // Loading state
  if (isLoading) {
    return (
      <Main>
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Main>
    );
  }

  // Error state
  if (error) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Tech Stacks
          </Button>
        </div>
      </Main>
    );
  }

  // No tech stack selected
  if (!selectedTechStack) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">No Tech Stack Selected</h2>
          <p className="text-muted-foreground">
            Please select a tech stack to view details.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Back to Tech Stacks
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "My Stacks", href: "/mystacks" },
              { label: selectedTechStack.name, href: "#" },
            ]}
          />
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-2xl font-bold">{selectedTechStack.name}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{selectedTechStack.appType}</Badge>
          <Badge variant="outline">{selectedTechStack.frontEndStack}</Badge>
          <Badge variant="outline">{selectedTechStack.backEndStack}</Badge>
          <Badge variant="outline">{selectedTechStack.databaseStack}</Badge>
          {selectedTechStack.deploymentStack && (
            <Badge variant="outline">{selectedTechStack.deploymentStack}</Badge>
          )}
          {selectedTechStack.phases &&
            selectedTechStack.phases.map((phase) => (
              <Badge key={phase}>{phase}</Badge>
            ))}
        </div>
      </div>

      {/* Display insufficient credits alert when needed */}
      {hasInsufficientCredits && (
        <div className="mb-6">
          <InsufficientCreditsAlert />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <TechStackGeneral selectedTechStack={selectedTechStack} />
        </TabsContent>
        <TabsContent value="assets" className="mt-6">
          <TechStackAssets
            assets={assets}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            generatingAssets={generatingAssets}
            isDownloading={isDownloading}
            handleCreateAsset={handleCreateAsset}
            handleDownloadAssets={handleDownloadAssets}
          />
        </TabsContent>
      </Tabs>

      {/* Asset Form Dialog */}
      <AssetForm
        isOpen={isAssetDialogOpen}
        onClose={() => setIsAssetDialogOpen(false)}
        onSave={handleSaveAsset}
        asset={selectedAsset}
      />

      {/* Delete Tech Stack Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              tech stack and all associated assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Asset Dialog */}
      <AlertDialog
        open={isAssetDeleteDialogOpen}
        onOpenChange={setIsAssetDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              asset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAsset}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
