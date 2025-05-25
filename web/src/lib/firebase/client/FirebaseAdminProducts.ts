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
  getDocs,
  getCountFromServer,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  Firestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Phases, Product } from "../schema";

const productConverter: FirestoreDataConverter<Product> = {
  toFirestore: (product) => product,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Product {
    const data = snapshot.data(options) as Product;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseAdminProducts {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  collectionName: string;
  rootCollectionName: string;
  usersCollectionName: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);
      this.collectionName = "products";
      this.rootCollectionName = "products";
      this.usersCollectionName = "users";
      
      console.log("[FirebaseAdminProducts] Initialized");
    } catch (error) {
      console.error(
        "[FirebaseAdminProducts][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get a reference to the users collection
   * This is needed to access the nested products collections
   */
  getUsersCollection(): CollectionReference<DocumentData> {
    return collection(this.db, this.usersCollectionName);
  }

  /**
   * Get a query to fetch all users
   * We need this to iterate through all users' products
   */
  getAllUsersQuery(): Query<DocumentData, DocumentData> {
    return query(this.getUsersCollection());
  }
  
  /**
   * Get a reference to a specific user's products collection
   * @param userId The user ID
   */
  getUserProductsCollection(userId: string): CollectionReference<DocumentData> {
    return collection(this.db, `${this.rootCollectionName}/${userId}/${this.collectionName}`);
  }
  
  /**
   * Get a query for all products for a specific user
   * @param userId The user ID
   */
  getUserProductsQuery(userId: string): Query<DocumentData, DocumentData> {
    return query(this.getUserProductsCollection(userId), orderBy("updatedAt", "desc"));
  }
  
  /**
   * Get a query for all products across all users
   * This is a special query that collects products from all users
   * For use with useCollectionData from react-firebase-hooks
   */
  getAllProductsQuery(): Query<DocumentData, DocumentData> {
    // Since we can't query across subcollections directly in Firestore,
    // we'll use a collection group query
    return query(
      collectionGroup(this.db, this.collectionName),
      orderBy("updatedAt", "desc")
    );
  }

  /**
   * Get a query for all products with pagination
   * For use with useCollectionData from react-firebase-hooks
   * @param pageSize Number of products per page
   * @param lastVisible Last visible document for pagination
   * @param sortField Field to sort by
   * @param sortDirection Sort direction
   */
  getProductsQuery(
    pageSize: number = 10,
    lastVisible?: DocumentData,
    sortField: string = "updatedAt",
    sortDirection: "asc" | "desc" = "desc"
  ): Query<DocumentData, DocumentData> {
    // Use collectionGroup to query across all products subcollections
    let productsQuery = query(
      collectionGroup(this.db, this.collectionName),
      orderBy(sortField, sortDirection)
    );

    // Add pagination if lastVisible is provided
    if (lastVisible) {
      productsQuery = query(productsQuery, startAfter(lastVisible), limit(pageSize));
    } else {
      productsQuery = query(productsQuery, limit(pageSize));
    }

    return productsQuery;
  }

  /**
   * Get a query for products filtered by search term
   * For use with useCollectionData from react-firebase-hooks
   * @param searchField Field to search in
   * @param searchTerm Term to search for
   * @param pageSize Number of products per page
   */
  getProductsSearchQuery(
    searchField: string,
    searchTerm: string,
    pageSize: number = 10
  ): Query<DocumentData, DocumentData> {
    return query(
      collectionGroup(this.db, this.collectionName),
      where(searchField, ">=", searchTerm),
      where(searchField, "<=", searchTerm + "\uf8ff"),
      limit(pageSize)
    );
  }

  /**
   * Get a query for products filtered by a specific field
   * For use with useCollectionData from react-firebase-hooks
   * @param field Field to filter by
   * @param value Value to filter for
   * @param pageSize Number of products per page
   */
  getProductsFilterQuery(
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
   * Get a query for counting all products
   * This uses collectionGroup to query across all subcollections
   */
  getProductsCountQuery(): Query<DocumentData, DocumentData> {
    return query(collectionGroup(this.db, this.collectionName));
  }
  
  /**
   * Get a query for trending products (most recently updated)
   * @param count Number of trending products to retrieve
   */
  getTrendingProductsQuery(count: number = 5): Query<DocumentData, DocumentData> {
    return query(
      collectionGroup(this.db, this.collectionName),
      orderBy("updatedAt", "desc"),
      limit(count)
    );
  }
  
  /**
   * Get a query for products created within a specific time range
   * @param startTime Start timestamp (in seconds)
   * @param endTime End timestamp (in seconds)
   */
  getProductsInTimeRangeQuery(
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
export const firebaseAdminProducts = new FirebaseAdminProducts();
export default FirebaseAdminProducts;
