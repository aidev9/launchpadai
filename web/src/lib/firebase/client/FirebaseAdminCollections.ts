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

const collectionConverter: FirestoreDataConverter<DocumentData> = {
  toFirestore: (collection) => collection,
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

class FirebaseAdminCollections {
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
      this.collectionName = "mycollections";

      console.log("[FirebaseAdminCollections] Initialized");
    } catch (error) {
      console.error(
        "[FirebaseAdminCollections][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a query for counting all collections
   * This uses collectionGroup to query across all subcollections
   */
  getCollectionsCountQuery(): Query<DocumentData, DocumentData> {
    return query(collectionGroup(this.db, this.collectionName));
  }

  /**
   * Get a query for all collections with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of collections per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getCollectionsQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "updatedAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Use collectionGroup to query across all collections subcollections
    let collectionsQuery = query(
      collectionGroup(this.db, this.collectionName),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      collectionsQuery = query(
        collectionsQuery,
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      collectionsQuery = query(collectionsQuery, limit(pageSize));
    }

    return collectionsQuery;
  }

  /**
   * Get a query for collections filtered by a specific field
   * For use with useCollectionData from react-firebase-hooks
   * @param field Field to filter by
   * @param value Value to filter for
   * @param pageSize Number of collections per page
   */
  getCollectionsFilterQuery(
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

  /**
   * Get a query for collections created within a specific time range
   * @param startTime Start timestamp (in seconds)
   * @param endTime End timestamp (in seconds)
   */
  getCollectionsInTimeRangeQuery(
    startTime: number,
    endTime: number
  ): Query<DocumentData, DocumentData> {
    return query(
      collectionGroup(this.db, this.collectionName),
      where("createdAt", ">=", startTime),
      where("createdAt", "<=", endTime),
      orderBy("createdAt", "asc")
    );
  }
}

// Export as a singleton
export const firebaseAdminCollections = new FirebaseAdminCollections();
export default FirebaseAdminCollections;
