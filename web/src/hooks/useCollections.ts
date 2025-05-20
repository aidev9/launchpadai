import { useCallback, useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  allCollectionsAtom,
  selectedProductIdAtom,
  selectedCollectionAtom,
  collectionsLoadingAtom,
  collectionsErrorAtom,
  updateCollectionStatusAtom as updateCollectionStatusAtomFn,
  filteredCollectionsAtom,
  collectionPhaseFilterAtom,
  collectionSearchQueryAtom,
  collectionStatusFilterAtom,
} from "@/lib/store/collection-store";
import {
  getCollectionsByProduct,
  getUserCollections,
  getCollection,
  updateCollectionStatus as updateCollectionStatusFn,
} from "@/lib/firebase/collections";
import { Collection, CollectionStatus } from "@/lib/firebase/schema";

interface UseCollectionsProps {
  productId?: string | null;
  loadCollections?: boolean;
}

export function useCollections({
  productId = null,
  loadCollections = true,
}: UseCollectionsProps = {}) {
  // State atoms
  const [collections, setCollections] = useAtom(allCollectionsAtom);
  const [isLoading, setIsLoading] = useAtom(collectionsLoadingAtom);
  const [error, setError] = useAtom(collectionsErrorAtom);
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [selectedCollection, setSelectedCollection] = useAtom(
    selectedCollectionAtom
  );
  const [filteredCollections] = useAtom(filteredCollectionsAtom);

  // Filter atoms
  const [phaseFilter, setPhaseFilter] = useAtom(collectionPhaseFilterAtom);
  const [statusFilter, setStatusFilter] = useAtom(collectionStatusFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(collectionSearchQueryAtom);

  // Update collection status atom
  const [, updateCollectionStatusAtom] = useAtom(updateCollectionStatusAtomFn);

  // Set the selected product ID when it changes
  useEffect(() => {
    if (productId !== null) {
      setSelectedProductId(productId);
    }
  }, [productId, setSelectedProductId]);

  // Fetch collections for a specific product
  const fetchCollectionsByProduct = useCallback(
    async (productId: string, forceRefresh = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getCollectionsByProduct(productId);

        if (result.success) {
          setCollections(result.collections || []);
        } else {
          setError(result.error || "Failed to fetch collections");
          setCollections([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setCollections, setIsLoading, setError]
  );

  // Fetch all collections for the current user
  const fetchAllCollections = useCallback(
    async (forceRefresh = false, showLoading = true) => {
      // Always refresh when explicitly requested
      if (!forceRefresh && collections.length > 0) return;

      try {
        // Only show loading indicator if showLoading is true
        if (showLoading) {
          setIsLoading(true);
        }
        setError(null);

        const result = await getUserCollections();

        if (result.success) {
          // Compare collections to avoid unnecessary renders
          const newCollections = result.collections || [];

          // Only update if collections have actually changed
          const hasChanged =
            collections.length !== newCollections.length ||
            JSON.stringify(collections.map((c) => c.id).sort()) !==
              JSON.stringify(newCollections.map((c) => c.id).sort());

          if (hasChanged || forceRefresh) {
            setCollections(newCollections);
          }
        } else {
          setError(result.error || "Failed to fetch collections");
          setCollections([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setCollections([]);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [collections, setCollections, setIsLoading, setError]
  );

  // Get a specific collection by ID
  const fetchCollectionById = useCallback(
    async (collectionId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find collection in existing collections first
        let foundCollection = collections.find((c) => c.id === collectionId);

        // If not found locally, fetch from server
        if (!foundCollection) {
          const result = await getCollection(collectionId);

          if (result.success && result.collection) {
            foundCollection = result.collection;

            // Add to collections if it's not already there
            if (!collections.some((c) => c.id === collectionId)) {
              setCollections((prev) => [...prev, result.collection!]);
            }
          } else {
            setError(result.error || "Failed to fetch collection");
            return null;
          }
        }

        // Update selected collection
        setSelectedCollection(foundCollection);
        return foundCollection;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [collections, setCollections, setSelectedCollection, setIsLoading, setError]
  );

  // Update a collection's status
  const handleUpdateCollectionStatus = useCallback(
    async (collectionId: string, status: CollectionStatus) => {
      try {
        setIsLoading(true);
        setError(null);

        // Optimistic update
        updateCollectionStatusAtom({ id: collectionId, status });

        // Perform actual update
        const result = await updateCollectionStatusFn(collectionId, status);

        if (!result.success) {
          throw new Error(result.error || "Failed to update collection status");
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");

        // Refresh the collection to revert the optimistic update
        await fetchCollectionById(collectionId);

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      updateCollectionStatusAtom,
      updateCollectionStatusFn,
      fetchCollectionById,
      setIsLoading,
      setError,
    ]
  );

  // Clear the selected collection
  const clearCollectionSelection = useCallback(() => {
    setSelectedCollection(null);
  }, [setSelectedCollection]);

  // Load collections on initial mount if requested
  useEffect(() => {
    if (!loadCollections) return;

    if (selectedProductId) {
      fetchCollectionsByProduct(selectedProductId);
    } else {
      fetchAllCollections();
    }
  }, [
    selectedProductId,
    fetchCollectionsByProduct,
    fetchAllCollections,
    loadCollections,
  ]);

  return {
    collections: filteredCollections,
    isLoading,
    error,
    selectedProductId,
    setSelectedProductId,
    selectedCollection,
    setSelectedCollection,
    fetchCollectionsByProduct,
    fetchAllCollections,
    fetchCollectionById,
    updateCollectionStatus: handleUpdateCollectionStatus,
    clearCollectionSelection,
    phaseFilter,
    setPhaseFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  };
}
