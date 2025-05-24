import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useToast } from "@/hooks/use-toast";
import { productAtom, collectionsAtom, Collection } from "@/lib/atoms/product";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import {
  createCollectionAction,
  createDocumentAction,
} from "@/app/(protected)/mycollections/actions";
import { WizardCollection, WizardDocument } from "../types";
import { DocumentStatus } from "@/lib/firebase/schema";

// Persistent wizard collections atom
const wizardCollectionsAtom = atomWithStorage<WizardCollection[]>(
  "wizardCollections",
  []
);

export function useWizardState() {
  const [product] = useAtom(productAtom);
  const [collections, setCollections] = useAtom(collectionsAtom);
  const [wizardCollections, setWizardCollections] = useAtom(
    wizardCollectionsAtom
  );

  // Current editing states
  const [activeTab, setActiveTab] = useState(
    wizardCollections.length === 0 ? "add-collection" : "collections"
  );
  const [selectedCollection, setSelectedCollection] =
    useState<WizardCollection | null>(null);
  const [editingCollection, setEditingCollection] =
    useState<WizardCollection | null>(null);
  const [editingDocument, setEditingDocument] = useState<WizardDocument | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  // Update active tab when collections change
  useEffect(() => {
    if (wizardCollections.length === 0 && activeTab === "collections") {
      setActiveTab("add-collection");
    }
  }, [wizardCollections.length, activeTab]);

  // Expose upload state to main wizard for button text updates
  useEffect(() => {
    (window as any)[`currentMiniWizard_ADD_COLLECTIONS`] = {
      ...((window as any)[`currentMiniWizard_ADD_COLLECTIONS`] || {}),
      isSubmitting: isUploading,
    };
  }, [isUploading]);

  // Collection management functions
  const addCollection = (newCollection: WizardCollection) => {
    if (editingCollection) {
      // Update existing collection
      setWizardCollections((prev) =>
        prev.map((c) => (c === editingCollection ? newCollection : c))
      );
      setEditingCollection(null);
    } else {
      // Add new collection
      setWizardCollections((prev) => [...prev, newCollection]);
    }
    setActiveTab("collections");
  };

  const editCollection = (collection: WizardCollection) => {
    setEditingCollection(collection);
    setActiveTab("add-collection");
  };

  const deleteCollection = (collection: WizardCollection) => {
    setWizardCollections((prev) => prev.filter((c) => c !== collection));
    if (selectedCollection === collection) {
      setSelectedCollection(null);
    }
  };

  const cancelEditingCollection = () => {
    setEditingCollection(null);
  };

  // Document management functions
  const addDocument = (newDocument: WizardDocument) => {
    if (!selectedCollection) return;

    setWizardCollections((prev) =>
      prev.map((c) =>
        c === selectedCollection
          ? {
              ...c,
              documents: editingDocument
                ? c.documents.map((d) =>
                    d === editingDocument ? newDocument : d
                  )
                : [...c.documents, newDocument],
            }
          : c
      )
    );

    // Update selected collection reference
    setSelectedCollection((prev) =>
      prev
        ? {
            ...prev,
            documents: editingDocument
              ? prev.documents.map((d) =>
                  d === editingDocument ? newDocument : d
                )
              : [...prev.documents, newDocument],
          }
        : null
    );

    setEditingDocument(null);
  };

  const editDocument = (document: WizardDocument) => {
    setEditingDocument(document);
  };

  const deleteDocument = (document: WizardDocument) => {
    if (!selectedCollection) return;

    setWizardCollections((prev) =>
      prev.map((c) =>
        c === selectedCollection
          ? { ...c, documents: c.documents.filter((d) => d !== document) }
          : c
      )
    );

    setSelectedCollection((prev) =>
      prev
        ? { ...prev, documents: prev.documents.filter((d) => d !== document) }
        : null
    );
  };

  const cancelEditingDocument = () => {
    setEditingDocument(null);
  };

  // Helper to update document status in wizard collections
  const updateDocumentStatus = (
    document: WizardDocument,
    status: DocumentStatus,
    uploadProgress?: number
  ) => {
    setWizardCollections((collections) =>
      collections.map((col) =>
        col === selectedCollection
          ? {
              ...col,
              documents: col.documents.map((doc) =>
                doc === document ? { ...doc, status, uploadProgress } : doc
              ),
            }
          : col
      )
    );

    if (selectedCollection) {
      setSelectedCollection((prev) =>
        prev
          ? {
              ...prev,
              documents: prev.documents.map((doc) =>
                doc === document ? { ...doc, status, uploadProgress } : doc
              ),
            }
          : null
      );
    }
  };

  // Persist collections to Firebase
  const persistCollectionsToFirebase = async (): Promise<boolean> => {
    if (!product?.id) {
      console.log(
        "[useWizardState] No product ID available, skipping Firebase persistence"
      );
      return true;
    }

    if (wizardCollections.length === 0) {
      console.log(
        "[useWizardState] No collections to persist, skipping Firebase persistence"
      );
      return true;
    }

    setIsUploading(true);

    try {
      console.log(
        "[useWizardState] Persisting collections to Firebase:",
        wizardCollections
      );

      // First, create all collections
      for (const collection of wizardCollections) {
        const collectionData = {
          productId: product.id!,
          title: collection.title,
          description: collection.description,
          phaseTags: collection.phaseTags,
          tags: collection.tags,
          status: "uploaded" as const,
        };

        // Use the same action as mycollections for consistency
        const collectionResult = await createCollectionAction(collectionData);

        if (!collectionResult.success) {
          throw new Error(
            collectionResult.error || "Failed to create collection"
          );
        }

        // Then create all documents for this collection
        for (const document of collection.documents) {
          // Set uploading document for UI feedback
          setUploadingDocument(document.title);

          const documentData = {
            collectionId: collectionResult.id!,
            productId: product.id!,
            title: document.title,
            description: document.description,
            url: "", // Will be set during upload if file exists
            filePath: "", // Will be set during upload if file exists
            tags: document.tags,
            chunkSize: document.chunkSize,
            overlap: document.overlap,
            status: "uploading" as DocumentStatus,
          };

          // Update document status to show it's being processed
          updateDocumentStatus(document, "uploading", 25);

          // Ensure file is properly formatted for upload
          let fileToUpload = document.file;
          if (fileToUpload) {
            if (!(fileToUpload instanceof File)) {
              console.warn(
                "[useWizardState] File is not a File instance, skipping file upload"
              );
              fileToUpload = undefined;
            } else if (
              !fileToUpload.arrayBuffer ||
              typeof fileToUpload.arrayBuffer !== "function"
            ) {
              console.warn(
                "[useWizardState] File does not have arrayBuffer method, skipping file upload"
              );
              fileToUpload = undefined;
            }
          }

          // Use the same action as mycollections for consistency and proper upload handling
          const documentResult = await createDocumentAction(
            documentData,
            fileToUpload
          );

          if (!documentResult.success) {
            updateDocumentStatus(document, "uploaded", 0);
            throw new Error(
              documentResult.error || "Failed to create document"
            );
          }

          // Update status to show completion - the cloud function will update to "indexing" then "indexed"
          updateDocumentStatus(document, "uploaded", 100);
        }
      }

      setUploadingDocument(null);
      toast({
        title: "Collections Saved",
        description: `Successfully saved ${wizardCollections.length} collections to Firebase`,
      });

      // Update the collections atom with the data from wizard collections
      const atomCollections: Collection[] = wizardCollections.map((wc) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        userId: "temp",
        productId: product?.id || "",
        title: wc.title,
        description: wc.description,
        phaseTags: wc.phaseTags,
        tags: wc.tags,
        status: "uploaded",
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      }));
      setCollections(atomCollections);

      return true;
    } catch (error) {
      console.error(
        "[useWizardState] Error persisting collections to Firebase:",
        error
      );
      setUploadingDocument(null);
      toast({
        title: "Upload Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload collections",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    // State
    wizardCollections,
    activeTab,
    selectedCollection,
    editingCollection,
    editingDocument,
    isUploading,
    uploadingDocument,
    product,

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
  };
}
