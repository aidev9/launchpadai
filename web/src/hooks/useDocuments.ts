import { useCallback, useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  collectionDocumentsAtom,
  selectedDocumentAtom,
  documentsLoadingAtom,
  documentsErrorAtom,
  updateDocumentStatusAtom as updateDocumentStatusAtomFn,
  filteredDocumentsAtom,
  documentSearchQueryAtom,
  documentStatusFilterAtom,
} from "@/lib/store/collection-store";
import {
  getDocumentsByCollection,
  getDocument,
  updateDocumentStatus as updateDocumentStatusFn,
} from "@/lib/firebase/documents";
import { Document, DocumentStatus } from "@/lib/firebase/schema";

interface UseDocumentsProps {
  collectionId?: string | null;
  loadDocuments?: boolean;
}

export function useDocuments({
  collectionId = null,
  loadDocuments = true,
}: UseDocumentsProps = {}) {
  // State atoms
  const [documents, setDocuments] = useAtom(collectionDocumentsAtom);
  const [isLoading, setIsLoading] = useAtom(documentsLoadingAtom);
  const [error, setError] = useAtom(documentsErrorAtom);
  const [selectedDocument, setSelectedDocument] = useAtom(selectedDocumentAtom);
  const [filteredDocuments] = useAtom(filteredDocumentsAtom);

  // Filter atoms
  const [statusFilter, setStatusFilter] = useAtom(documentStatusFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(documentSearchQueryAtom);

  // Update document status atom
  const [, updateDocumentStatusAtom] = useAtom(updateDocumentStatusAtomFn);

  // Fetch documents for a specific collection
  const fetchDocumentsByCollection = useCallback(
    async (collectionId: string, forceRefresh = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getDocumentsByCollection(collectionId);

        if (result.success) {
          setDocuments(result.documents || []);
        } else {
          setError(result.error || "Failed to fetch documents");
          setDocuments([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setDocuments, setIsLoading, setError]
  );

  // Get a specific document by ID
  const fetchDocumentById = useCallback(
    async (documentId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find document in existing documents first
        let foundDocument = documents.find((d) => d.id === documentId);

        // If not found locally, fetch from server
        if (!foundDocument) {
          const result = await getDocument(documentId);

          if (result.success && result.document) {
            foundDocument = result.document;

            // Add to documents if it's not already there
            if (!documents.some((d) => d.id === documentId)) {
              setDocuments((prev) => [...prev, result.document!]);
            }
          } else {
            setError(result.error || "Failed to fetch document");
            return null;
          }
        }

        // Update selected document
        setSelectedDocument(foundDocument);
        return foundDocument;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [documents, setDocuments, setSelectedDocument, setIsLoading, setError]
  );

  // Update a document's status
  const handleUpdateDocumentStatus = useCallback(
    async (documentId: string, status: DocumentStatus) => {
      try {
        setIsLoading(true);
        setError(null);

        // Optimistic update
        updateDocumentStatusAtom({ id: documentId, status });

        // Perform actual update
        const result = await updateDocumentStatusFn(documentId, status);

        if (!result.success) {
          throw new Error(result.error || "Failed to update document status");
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");

        // Refresh the document to revert the optimistic update
        await fetchDocumentById(documentId);

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateDocumentStatusAtom, fetchDocumentById, setIsLoading, setError]
  );

  // Clear the selected document
  const clearDocumentSelection = useCallback(() => {
    setSelectedDocument(null);
  }, [setSelectedDocument]);

  // Load documents on initial mount if requested
  useEffect(() => {
    if (!loadDocuments || !collectionId) return;

    fetchDocumentsByCollection(collectionId);
  }, [collectionId, fetchDocumentsByCollection, loadDocuments]);

  return {
    documents: filteredDocuments,
    isLoading,
    error,
    selectedDocument,
    setSelectedDocument,
    fetchDocumentsByCollection,
    fetchDocumentById,
    updateDocumentStatus: handleUpdateDocumentStatus,
    clearDocumentSelection,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  };
}
