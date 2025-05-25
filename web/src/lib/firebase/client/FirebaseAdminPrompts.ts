import { getAuth } from "firebase/auth";
import {
  collection,
  collectionGroup,
  DocumentData,
  getFirestore,
  orderBy,
  query,
  Query,
  where,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  CollectionReference,
  limit,
  startAfter,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";

const promptConverter: FirestoreDataConverter<DocumentData> = {
  toFirestore: (prompt) => prompt,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): DocumentData {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseAdminPrompts {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  collectionName: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);
      this.collectionName = "myprompts";

      console.log(
        "[FirebaseAdminPrompts] Initialized with collection:",
        this.collectionName
      );
    } catch (error) {
      console.error(
        "[FirebaseAdminPrompts][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a query for counting all prompts
   * This uses collectionGroup to query across all subcollections
   */
  getPromptsCountQuery(): Query<DocumentData, DocumentData> {
    return query(collectionGroup(this.db, this.collectionName));
  }

  /**
   * Get a query for all prompts with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of prompts per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getPromptsQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "updatedAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Use collectionGroup to query across all prompts subcollections
    let promptsQuery = query(
      collectionGroup(this.db, this.collectionName),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      promptsQuery = query(
        promptsQuery,
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      promptsQuery = query(promptsQuery, limit(pageSize));
    }

    return promptsQuery;
  }

  /**
   * Get a query for prompts filtered by search term
   * For use with useCollectionData from react-firebase-hooks
   * @param searchField Field to search in
   * @param searchTerm Term to search for
   * @param pageSize Number of prompts per page
   */
  getPromptsSearchQuery(
    searchField: string,
    searchTerm: string,
    pageSize: number = 10
  ): Query<DocumentData, DocumentData> {
    return query(
      collectionGroup(this.db, this.collectionName),
      where(searchField, ">=", searchTerm),
      where(searchField, "<=", searchTerm + "\\uf8ff"),
      limit(pageSize)
    );
  }

  /**
   * Get a query for prompts filtered by a specific field
   * For use with useCollectionData from react-firebase-hooks
   * @param field Field to filter by
   * @param value Value to filter for
   * @param pageSize Number of prompts per page
   */
  getPromptsFilterQuery(
    field: string,
    value: any,
    pageSize: number = 10
  ): Query<DocumentData, DocumentData> {
    return query(
      collectionGroup(this.db, this.collectionName),
      where(field, "==", value),
      orderBy("updatedAt", "desc"),
      limit(pageSize)
    );
  }
}

// Export as a singleton
export const firebaseAdminPrompts = new FirebaseAdminPrompts();
export default FirebaseAdminPrompts;
