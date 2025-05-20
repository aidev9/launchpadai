"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import {
  selectedDocumentAtom,
  selectedCollectionAtom,
} from "@/lib/store/collection-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Edit, Trash } from "lucide-react";
import { DocumentForm } from "../collection/components/document-form";
import { Document } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { deleteDocumentAction } from "../../mycollections/actions";
import { DocumentViewer } from "./components/document-viewer";
import { updateDocumentStatus } from "@/lib/firebase/documents";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function DocumentView() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useAtom(selectedDocumentAtom);
  const [selectedCollection] = useAtom(selectedCollectionAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // Redirect if no document is selected
  useEffect(() => {
    if (!selectedDocument) {
      router.push("/mycollections");
    }
  }, [selectedDocument, router]);

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    try {
      setIsSubmitting(true);

      // Store document info before closing dialog
      const documentId = selectedDocument.id;
      const documentTitle = selectedDocument.title;

      // Close the dialog
      setIsDeleteDialogOpen(false);

      // Perform the deletion
      const result = await deleteDocumentAction(documentId);

      if (result.success) {
        toast({
          title: "Success",
          description: `"${documentTitle}" deleted successfully`,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Navigate back to the collection page
        if (selectedCollection) {
          router.push(`/mycollections/collection`);
        } else {
          router.push("/mycollections");
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete document",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit document
  const handleEditDocument = () => {
    // Open the document edit modal
    setIsDocumentModalOpen(true);
  };

  // Handle document update success
  const handleDocumentUpdated = (updatedDocument: Document) => {
    // Update the selected document with the new data
    setSelectedDocument(updatedDocument);

    toast({
      title: "Success",
      description: "Document updated successfully",
      duration: TOAST_DEFAULT_DURATION,
    });
  };

  if (!selectedDocument) {
    return null;
  }

  return (
    <Main>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "My Collections", href: "/mycollections" },
              {
                label: selectedCollection?.title || "Collection",
                href: "/mycollections/collection",
              },
              { label: selectedDocument.title, isCurrentPage: true },
            ]}
          />
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleEditDocument}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedDocument.title}
            </h1>
            <p className="text-muted-foreground">
              {selectedDocument.description}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <DocumentViewer document={selectedDocument} />
        </div>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Document"
          desc={
            <>
              Are you sure you want to delete{" "}
              <strong>{selectedDocument.title}</strong>?
              <p className="mt-2">
                This action cannot be undone. The document and its associated
                file will be permanently removed.
              </p>
            </>
          }
          confirmText="Delete"
          destructive={true}
          handleConfirm={handleDeleteDocument}
          isLoading={isSubmitting}
        />

        {/* Document edit modal */}
        {selectedDocument && selectedCollection && (
          <DocumentForm
            isOpen={isDocumentModalOpen}
            onClose={() => setIsDocumentModalOpen(false)}
            collectionId={selectedCollection.id}
            productId={selectedCollection.productId}
            onSuccess={handleDocumentUpdated}
            documentToEdit={selectedDocument}
          />
        )}
      </div>
    </Main>
  );
}
