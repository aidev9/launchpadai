import { MiniWizardId } from "@/lib/firebase/schema/enums";
import MiniWizardBase, { MiniWizardProps } from "../MiniWizardBase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, FolderPlus, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWizardState } from "./hooks/use-wizard-state";
import { CollectionForm } from "./collection-form";
import { CollectionsList } from "./collections-list";
import { DocumentForm } from "./document-form";
import { DocumentsList } from "./documents-list";

export default function AddCollectionsWizard({
  onBack,
  onComplete,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
>) {
  const {
    // State
    wizardCollections,
    activeTab,
    selectedCollection,
    editingCollection,
    editingDocument,
    isUploading,
    uploadingDocument,

    // Actions
    setActiveTab,
    setSelectedCollection,
    addCollection,
    editCollection,
    deleteCollection,
    cancelEditingCollection,
    addDocument,
    editDocument,
    deleteDocument,
    cancelEditingDocument,
    persistCollectionsToFirebase,
  } = useWizardState();

  // Handle wizard completion
  const handleWizardComplete = async (formData: Record<string, any>) => {
    console.log("[AddCollectionsWizard] Wizard completion triggered");

    // Persist collections to Firebase
    await persistCollectionsToFirebase();

    // Call the parent completion handler
    if (onComplete) {
      onComplete(formData);
    }
  };

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.ADD_COLLECTIONS}
      title="Add Collections"
      description="Create collections and add documents to organize and store information for your product."
      xpReward={50}
      onBack={onBack}
      onComplete={handleWizardComplete}
    >
      <div className="space-y-6">
        {/* Information alert */}
        {isUploading ? (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {uploadingDocument
                ? `Uploading "${uploadingDocument}"...`
                : "Uploading documents to Firebase..."}
            </AlertDescription>
          </Alert>
        ) : wizardCollections.length > 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {wizardCollections.length} collection
              {wizardCollections.length !== 1 ? "s" : ""} with{" "}
              {wizardCollections.reduce(
                (total, col) => total + col.documents.length,
                0
              )}{" "}
              document
              {wizardCollections.reduce(
                (total, col) => total + col.documents.length,
                0
              ) !== 1
                ? "s"
                : ""}
              . These will be uploaded to Firebase when you complete this step.
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={isUploading ? undefined : setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collections" disabled={isUploading}>
              Collections ({wizardCollections.length})
            </TabsTrigger>
            <TabsTrigger value="add-collection" disabled={isUploading}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Collection
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              disabled={!selectedCollection || isUploading}
            >
              Documents{" "}
              {selectedCollection
                ? `(${selectedCollection.documents.length})`
                : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collections" className="space-y-4">
            <CollectionsList
              collections={wizardCollections}
              selectedCollection={selectedCollection}
              onSelectCollection={setSelectedCollection}
              onEditCollection={editCollection}
              onDeleteCollection={deleteCollection}
              onCreateCollection={() => setActiveTab("add-collection")}
            />
          </TabsContent>

          <TabsContent value="add-collection" className="space-y-4">
            <CollectionForm
              editingCollection={editingCollection}
              onAddCollection={addCollection}
              onCancel={cancelEditingCollection}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {selectedCollection && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Documents in "{selectedCollection.title}"
                  </h3>
                  <Button
                    onClick={() => {
                      cancelEditingDocument();
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>

                {/* Document Form */}
                <DocumentForm
                  editingDocument={editingDocument}
                  onAddDocument={addDocument}
                  onCancel={cancelEditingDocument}
                />

                {/* Documents List */}
                <DocumentsList
                  documents={selectedCollection.documents}
                  onEditDocument={editDocument}
                  onDeleteDocument={deleteDocument}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MiniWizardBase>
  );
}
