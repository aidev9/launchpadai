import { getAuth } from "firebase/auth";
import {
  collection,
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
  endBefore,
  limitToLast,
  Firestore,
  doc,
  DocumentReference,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { UserProfile } from "../schema";

const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore: (user) => user,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options) as UserProfile;
    return {
      ...data,
      uid: snapshot.id,
    };
  },
};

class FirebaseAdminUsers {
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
      this.collectionName = "users";

      console.log("[FirebaseAdminUsers] Initialized");
    } catch (error) {
      console.error(
        "[FirebaseAdminUsers][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a reference to the users collection
   */
  getUsersCollection(): CollectionReference<DocumentData> {
    return collection(this.db, this.collectionName);
  }

  /**
   * Get a query for the total count of users
   * For use with useCollection from react-firebase-hooks
   */
  getUsersCountQuery(): Query<DocumentData, DocumentData> {
    return query(this.getUsersCollection());
  }

  /**
   * Get a query for all users with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of users per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getUsersQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "createdAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Start with base query
    let usersQuery = query(
      this.getUsersCollection(),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      usersQuery = query(usersQuery, startAfter(lastVisible), limit(pageSize));
    } else {
      usersQuery = query(usersQuery, limit(pageSize));
    }

    return usersQuery;
  }

  /**
   * Get a query for users filtered by search term
   * For use with useCollectionData from react-firebase-hooks
   * @param searchField Field to search in
   * @param searchTerm Term to search for
   * @param pageSize Number of users per page
   */
  getUsersSearchQuery(
    searchField: string,
    searchTerm: string,
    pageSize: number = 10
  ): Query<DocumentData, DocumentData> {
    return query(
      this.getUsersCollection(),
      where(searchField, ">=", searchTerm),
      where(searchField, "<=", searchTerm + "\\uf8ff"),
      limit(pageSize)
    );
  }

  /**
   * Get a query for admin users
   * For use with useCollectionData from react-firebase-hooks
   */
  getAdminUsersQuery(pageSize: number = 10): Query<DocumentData, DocumentData> {
    return query(
      this.getUsersCollection(),
      where("userType", "in", ["admin", "superadmin"]),
      limit(pageSize)
    );
  }

  /**
   * Get a reference to a specific user document
   * For use with useDocumentData from react-firebase-hooks
   * @param userId The user ID
   */
  getUserByIdQuery(userId: string): DocumentReference<UserProfile> {
    return doc(this.db, this.collectionName, userId).withConverter(
      userConverter
    );
  }
}

// Export as a singleton
export const firebaseAdminUsers = new FirebaseAdminUsers();
export default FirebaseAdminUsers;
