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

const agentConverter: FirestoreDataConverter<DocumentData> = {
  toFirestore: (agent) => agent,
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

class FirebaseAdminAgents {
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
      this.collectionName = "myagents";

      console.log("[FirebaseAdminAgents] Initialized");
    } catch (error) {
      console.error(
        "[FirebaseAdminAgents][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a query for counting all agents
   * This uses collectionGroup to query across all subcollections
   */
  getAgentsCountQuery(): Query<DocumentData, DocumentData> {
    return query(collectionGroup(this.db, this.collectionName));
  }

  /**
   * Get a query for all agents with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of agents per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getAgentsQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "updatedAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Use collectionGroup to query across all agents subcollections
    let agentsQuery = query(
      collectionGroup(this.db, this.collectionName),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      agentsQuery = query(
        agentsQuery,
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      agentsQuery = query(agentsQuery, limit(pageSize));
    }

    return agentsQuery;
  }

  /**
   * Get a query for agents filtered by a specific field
   * For use with useCollectionData from react-firebase-hooks
   * @param field Field to filter by
   * @param value Value to filter for
   * @param pageSize Number of agents per page
   */
  getAgentsFilterQuery(
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
   * Get a query for agents created within a specific time range
   * @param startTime Start timestamp (in seconds)
   * @param endTime End timestamp (in seconds)
   */
  getAgentsInTimeRangeQuery(
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
export const firebaseAdminAgents = new FirebaseAdminAgents();
export default FirebaseAdminAgents;
