"use client";

import { useState } from "react";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
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

// Import our hooks and handlers
import { useTechStackDetailWithQuery } from "./hooks/useTechStackDetail";
import { useTechStackHandlers } from "./handlers/techStackHandlers";
import { useAssetHandlersWithQuery } from "./handlers/assetHandlers";

export default function TechStackDetailWithQuery() {
  // Use our enhanced custom hooks
  const {
    router,
    toast,
    selectedTechStack,
    setSelectedTechStack,
    isLoading,
    setIsLoading,
    error,
    setError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activeTab,
    setActiveTab,
    assets,
    selectedAsset,
    setSelectedAsset,
    isAssetDialogOpen,
    setIsAssetDialogOpen,
    isGeneratingContent,
    isDownloading,
    setIsDownloading,
    generatingAssets,
    onGenerateContent,
    refetchAssets,
  } = useTechStackDetailWithQuery();

  // State for asset deletion confirmation
  const [isAssetDeleteDialogOpen, setIsAssetDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<any>(null);

  // Use our tech stack handlers
  const { handleBack, handleEdit, handleDelete, handleDownloadAssets } =
    useTechStackHandlers(
      selectedTechStack,
      setIsLoading,
      setIsDeleteDialogOpen,
      setIsDownloading
    );

  // Create an adapter function to convert between the two function signatures
  const generateAssetAdapter = (params: {
    assetId: string;
    assetType: string;
    techStackDetails: any;
    userInstructions?: string;
  }) => {
    // Find the asset with the given ID
    const asset = assets.find((a) => a.id === params.assetId);
    if (asset) {
      // Call the original function with the asset and instructions
      onGenerateContent(asset, params.userInstructions);
    }
  };

  // Use our enhanced asset handlers
  const {
    handleCreateAsset,
    handleEditAsset,
    handleSaveAsset,
    handleDeleteAsset,
    confirmDeleteAsset,
    handleGenerateContent,
    handleCopyAsset,
    handleDownloadAsset,
  } = useAssetHandlersWithQuery(
    selectedTechStack,
    assets,
    selectedAsset,
    setSelectedAsset,
    setIsAssetDialogOpen,
    isAssetDeleteDialogOpen,
    setIsAssetDeleteDialogOpen,
    assetToDelete,
    setAssetToDelete,
    generateAssetAdapter,
    refetchAssets
  );

  if (isLoading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Main>
    );
  }

  if (error) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/mystacks")} className="mt-4">
            Back to Tech Stacks
          </Button>
        </div>
      </Main>
    );
  }

  if (!selectedTechStack) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">No Tech Stack Selected</h2>
          <p className="text-muted-foreground">
            Please select a tech stack to view details.
          </p>
          <Button onClick={() => router.push("/mystacks")} className="mt-4">
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
          <Badge variant="outline">{selectedTechStack.backendStack}</Badge>
          <Badge variant="outline">{selectedTechStack.database}</Badge>
          {selectedTechStack.deploymentStack && (
            <Badge variant="outline">{selectedTechStack.deploymentStack}</Badge>
          )}
          {selectedTechStack.phase.map((phase) => (
            <Badge key={phase}>{phase}</Badge>
          ))}
        </div>
      </div>

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
            isGeneratingContent={isGeneratingContent}
            isDownloading={isDownloading}
            techStack={selectedTechStack}
            handleCreateAsset={handleCreateAsset}
            handleEditAsset={handleEditAsset}
            handleDeleteAsset={handleDeleteAsset}
            handleGenerateContent={handleGenerateContent}
            handleCopyAsset={handleCopyAsset}
            handleDownloadAsset={handleDownloadAsset}
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
