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
import { useTechStackDetail } from "./hooks/useTechStackDetail";
import { useTechStackHandlers } from "./handlers/techStackHandlers";
import { useAssetHandlers } from "./handlers/assetHandlers";

export default function TechStackDetail() {
  // Use our custom hooks
  const {
    router,
    toast,
    selectedTechStack,
    setSelectedTechStack,
    isLoading,
    setIsLoading,
    error,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    activeTab,
    setActiveTab,
    assets,
    setAssets,
    selectedAsset,
    setSelectedAsset,
    isAssetDialogOpen,
    setIsAssetDialogOpen,
    isGeneratingContent,
    setIsGeneratingContent,
    isDownloading,
    setIsDownloading,
    generatingAssets,
    setGeneratingAssets,
  } = useTechStackDetail();

  // Use our handlers
  const { handleBack, handleEdit, handleDelete, handleDownloadAssets } =
    useTechStackHandlers(
      selectedTechStack,
      setIsLoading,
      setIsDeleteDialogOpen,
      setIsDownloading
    );

  const {
    handleCreateAsset,
    handleEditAsset,
    handleSaveAsset,
    handleDeleteAsset,
    handleGenerateContent,
    handleCopyAsset,
    handleDownloadAsset,
  } = useAssetHandlers(
    selectedTechStack,
    assets,
    setAssets,
    selectedAsset,
    setSelectedAsset,
    setIsAssetDialogOpen,
    isGeneratingContent,
    setIsGeneratingContent,
    generatingAssets,
    setGeneratingAssets
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

  if (error || !selectedTechStack) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Error</h2>
          <p className="text-muted-foreground mt-2">
            {error || "Tech stack not found"}
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Breadcrumbs
              items={[
                { label: "My Stacks", href: "/mystacks" },
                { label: selectedTechStack.name, href: "#" },
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{selectedTechStack.name}</h1>
          <p className="text-muted-foreground mt-1">
            {selectedTechStack.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTechStack.phase.map((phase) => (
              <Badge key={phase} variant="outline">
                {phase}
              </Badge>
            ))}
            {selectedTechStack.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
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
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tech Stack</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tech stack? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssetForm
        isOpen={isAssetDialogOpen}
        onClose={() => setIsAssetDialogOpen(false)}
        onSave={handleSaveAsset}
        asset={selectedAsset}
      />
    </Main>
  );
}
