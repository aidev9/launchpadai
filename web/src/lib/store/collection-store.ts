import { atom } from "jotai";
import {
  Collection,
  Document,
  CollectionStatus,
  DocumentStatus,
} from "@/lib/firebase/schema";
import { Table, ColumnFiltersState, SortingState } from "@tanstack/react-table";

// Layout view type
export type CollectionViewMode = "grid" | "table";

// Base data atoms
export const allCollectionsAtom = atom<Collection[]>([]);
export const selectedProductIdAtom = atom<string | null>(null);
export const selectedCollectionAtom = atom<Collection | null>(null);
export const selectedDocumentAtom = atom<Document | null>(null);

// Documents for the selected collection
export const collectionDocumentsAtom = atom<Document[]>([]);

// UI state atoms
export const collectionModalOpenAtom = atom<boolean>(false);
export const documentModalOpenAtom = atom<boolean>(false);
export const isEditingCollectionAtom = atom<boolean>(false);
export const isEditingDocumentAtom = atom<boolean>(false);

// Loading and error states
export const collectionsLoadingAtom = atom<boolean>(false);
export const collectionsErrorAtom = atom<string | null>(null);
export const documentsLoadingAtom = atom<boolean>(false);
export const documentsErrorAtom = atom<string | null>(null);

// Filter atoms
export const collectionSearchQueryAtom = atom<string>("");
export const collectionPhaseFilterAtom = atom<string[]>([]);
export const collectionStatusFilterAtom = atom<CollectionStatus[]>([]);
export const documentSearchQueryAtom = atom<string>("");
export const documentStatusFilterAtom = atom<DocumentStatus[]>([]);
export const collectionViewModeAtom = atom<"grid" | "table">("grid");

// Table state atoms
export const collectionRowSelectionAtom = atom<Record<string, boolean>>({});
export const documentRowSelectionAtom = atom<Record<string, boolean>>({});
export const collectionColumnFiltersAtom = atom<ColumnFiltersState>([]);
export const documentColumnFiltersAtom = atom<ColumnFiltersState>([]);
export const collectionSortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);
export const documentSortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);
export const collectionColumnVisibilityAtom = atom<Record<string, boolean>>({});
export const documentColumnVisibilityAtom = atom<Record<string, boolean>>({});

// Table instances
export const collectionTableInstanceAtom = atom<Table<Collection> | null>(null);
export const documentTableInstanceAtom = atom<Table<Document> | null>(null);

// Derived atoms for filtered collections
export const filteredCollectionsAtom = atom((get) => {
  const collections = get(allCollectionsAtom);
  const productId = get(selectedProductIdAtom);
  const phaseFilter = get(collectionPhaseFilterAtom);
  const statusFilter = get(collectionStatusFilterAtom);
  const searchQuery = get(collectionSearchQueryAtom);

  let filtered = collections;

  // Filter by product ID if selected
  if (productId) {
    filtered = filtered.filter(
      (collection) => collection.productId === productId
    );
  }

  // Apply phase filter
  if (phaseFilter.length > 0) {
    filtered = filtered.filter((collection) =>
      collection.phaseTags.some((tag) => phaseFilter.includes(tag))
    );
  }

  // Apply status filter
  if (statusFilter.length > 0) {
    filtered = filtered.filter((collection) =>
      statusFilter.includes(collection.status)
    );
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (collection) =>
        collection.title.toLowerCase().includes(query) ||
        collection.description.toLowerCase().includes(query) ||
        collection.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Derived atoms for filtered documents
export const filteredDocumentsAtom = atom((get) => {
  const documents = get(collectionDocumentsAtom);
  const statusFilter = get(documentStatusFilterAtom);
  const searchQuery = get(documentSearchQueryAtom);

  let filtered = documents;

  // Apply status filter
  if (statusFilter.length > 0) {
    filtered = filtered.filter((document) =>
      statusFilter.includes(document.status)
    );
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (document) =>
        document.title.toLowerCase().includes(query) ||
        document.description.toLowerCase().includes(query) ||
        document.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Optimistic update atoms
export const updateCollectionAtom = atom(
  null,
  (get, set, updatedCollection: Collection) => {
    // Batch updates to reduce renders
    const selectedCollection = get(selectedCollectionAtom);
    const needsSelectedUpdate =
      selectedCollection && selectedCollection.id === updatedCollection.id;

    // Use a single transaction to update both atoms if needed
    if (needsSelectedUpdate) {
      // Update both the collection list and selected collection in one batch
      set(allCollectionsAtom, (prev) =>
        prev.map((collection) =>
          collection.id === updatedCollection.id
            ? updatedCollection
            : collection
        )
      );
      set(selectedCollectionAtom, updatedCollection);
    } else {
      // Just update the collection list
      set(allCollectionsAtom, (prev) =>
        prev.map((collection) =>
          collection.id === updatedCollection.id
            ? updatedCollection
            : collection
        )
      );
    }
  }
);

export const updateCollectionStatusAtom = atom(
  null,
  (get, set, payload: { id: string; status: CollectionStatus }) => {
    set(allCollectionsAtom, (prev) =>
      prev.map((collection) =>
        collection.id === payload.id
          ? {
              ...collection,
              status: payload.status,
              updatedAt: Date.now() / 1000,
            }
          : collection
      )
    );

    // If this is the selected collection, update it too
    const selectedCollection = get(selectedCollectionAtom);
    if (selectedCollection && selectedCollection.id === payload.id) {
      set(selectedCollectionAtom, {
        ...selectedCollection,
        status: payload.status,
        updatedAt: Date.now() / 1000,
      });
    }
  }
);

export const deleteCollectionAtom = atom(
  null,
  (get, set, collectionId: string) => {
    set(allCollectionsAtom, (prev) =>
      prev.filter((collection) => collection.id !== collectionId)
    );

    // If this is the selected collection, clear it
    const selectedCollection = get(selectedCollectionAtom);
    if (selectedCollection && selectedCollection.id === collectionId) {
      set(selectedCollectionAtom, null);
    }
  }
);

export const addCollectionAtom = atom(
  null,
  (get, set, newCollection: Collection) => {
    set(allCollectionsAtom, (prev) => [...prev, newCollection]);
  }
);

// Document optimistic update atoms
export const updateDocumentAtom = atom(
  null,
  (get, set, updatedDocument: Document) => {
    set(collectionDocumentsAtom, (prev) =>
      prev.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document
      )
    );

    // If this is the selected document, update it too
    const selectedDocument = get(selectedDocumentAtom);
    if (selectedDocument && selectedDocument.id === updatedDocument.id) {
      set(selectedDocumentAtom, updatedDocument);
    }
  }
);

export const updateDocumentStatusAtom = atom(
  null,
  (get, set, payload: { id: string; status: DocumentStatus }) => {
    set(collectionDocumentsAtom, (prev) =>
      prev.map((document) =>
        document.id === payload.id
          ? {
              ...document,
              status: payload.status,
              updatedAt: Date.now() / 1000,
            }
          : document
      )
    );

    // If this is the selected document, update it too
    const selectedDocument = get(selectedDocumentAtom);
    if (selectedDocument && selectedDocument.id === payload.id) {
      set(selectedDocumentAtom, {
        ...selectedDocument,
        status: payload.status,
        updatedAt: Date.now() / 1000,
      });
    }
  }
);

export const deleteDocumentAtom = atom(null, (get, set, documentId: string) => {
  set(collectionDocumentsAtom, (prev) =>
    prev.filter((document) => document.id !== documentId)
  );

  // If this is the selected document, clear it
  const selectedDocument = get(selectedDocumentAtom);
  if (selectedDocument && selectedDocument.id === documentId) {
    set(selectedDocumentAtom, null);
  }
});

export const addDocumentAtom = atom(null, (get, set, newDocument: Document) => {
  set(collectionDocumentsAtom, (prev) => [...prev, newDocument]);
});

export const deleteMultipleDocumentsAtom = atom(
  null,
  (get, set, documentIds: string[]) => {
    set(collectionDocumentsAtom, (prev) =>
      prev.filter((document) => !documentIds.includes(document.id))
    );

    // If the selected document is in the deleted list, clear it
    const selectedDocument = get(selectedDocumentAtom);
    if (selectedDocument && documentIds.includes(selectedDocument.id)) {
      set(selectedDocumentAtom, null);
    }
  }
);

export const deleteMultipleCollectionsAtom = atom(
  null,
  (get, set, collectionIds: string[]) => {
    set(allCollectionsAtom, (prev) =>
      prev.filter((collection) => !collectionIds.includes(collection.id))
    );

    // If the selected collection is in the deleted list, clear it
    const selectedCollection = get(selectedCollectionAtom);
    if (selectedCollection && collectionIds.includes(selectedCollection.id)) {
      set(selectedCollectionAtom, null);
    }
  }
);
