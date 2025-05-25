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

const stackConverter: FirestoreDataConverter<DocumentData> = {
  toFirestore: (stack) => stack,
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

class FirebaseAdminStacks {
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
      this.collectionName = "mystacks";

      console.log("[FirebaseAdminStacks] Initialized");
    } catch (error) {
      console.error(
        "[FirebaseAdminStacks][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a query for counting all stacks
   * This uses collectionGroup to query across all subcollections
   */
  getStacksCountQuery(): Query<DocumentData, DocumentData> {
    return query(collectionGroup(this.db, this.collectionName));
  }

  /**
   * Get a query for all stacks with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of stacks per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getStacksQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "updatedAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Use collectionGroup to query across all stacks subcollections
    let stacksQuery = query(
      collectionGroup(this.db, this.collectionName),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      stacksQuery = query(
        stacksQuery,
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      stacksQuery = query(stacksQuery, limit(pageSize));
    }

    return stacksQuery;
  }

  /**
   * Get a query for stacks filtered by a specific field
   * For use with useCollectionData from react-firebase-hooks
   * @param field Field to filter by
   * @param value Value to filter for
   * @param pageSize Number of stacks per page
   */
  getStacksFilterQuery(
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
   * Get a query for stacks created within a specific time range
   * @param startTime Start timestamp (in seconds)
   * @param endTime End timestamp (in seconds)
   */
  getStacksInTimeRangeQuery(
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
export const firebaseAdminStacks = new FirebaseAdminStacks();
export default FirebaseAdminStacks;
