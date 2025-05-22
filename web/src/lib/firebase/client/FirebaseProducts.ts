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
  deleteDoc,
  doc,
  getDoc,
  writeBatch,
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

class FirebaseProducts {
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

      // Add debugging to log the database name
      console.log(
        "[FirebaseProducts] Using database:",
        process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
      );

      this.storage = getStorage(clientApp);
      this.collectionName = "products";
    } catch (error) {
      console.error(
        "[FirebaseProducts][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getRefCollection(): CollectionReference<Product> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseProducts][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    // Add more detailed path debugging
    const path = `${this.collectionName}/${userId}/${this.collectionName}`;
    console.log(
      `[FirebaseProducts] Creating collection reference with path: ${path}`
    );
    console.log(
      `[FirebaseProducts] Using database:`,
      process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
    );

    return collection(this.db, path).withConverter(productConverter);
  }

  getProducts(): Query<DocumentData, DocumentData> | null {
    try {
      const productsQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return productsQuery;
    } catch (error) {
      return null;
    }
  }

  getProductsByPhase(
    phases: Phases[]
  ): Query<DocumentData, DocumentData> | null {
    if (phases.length === 0) {
      return null;
    }

    try {
      const productsQuery = query(
        this.getRefCollection(),
        where("phases", "array-contains-any", phases),
        orderBy("updatedAt", "desc")
      );

      return productsQuery;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a product by ID
   * @param id Product ID to delete
   * @returns Promise with success status
   */
  async deleteProduct(id: string) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const productRef = doc(this.getRefCollection(), id);

      // Check if product exists first
      const productDoc = await getDoc(productRef);
      if (!productDoc.exists()) {
        return {
          success: false,
          error: "Product not found",
        };
      }

      // Delete the product
      await deleteDoc(productRef);

      return {
        success: true,
        id,
      };
    } catch (error) {
      console.error(
        `[FirebaseProducts][deleteProduct] Error deleting product ${id}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete multiple products by ID
   * @param ids Array of product IDs to delete
   * @returns Promise with success status and count of deleted products
   */
  async deleteMultipleProducts(ids: string[]) {
    try {
      console.log(
        "FirebaseProducts.deleteMultipleProducts called with ids:",
        ids
      );

      if (!this.auth.currentUser) {
        console.log("No authenticated user found, auth object:", this.auth);
        return {
          success: false,
          error: "User not authenticated",
          deletedCount: 0,
        };
      }

      console.log("User authenticated with ID:", this.auth.currentUser.uid);

      // Validate inputs
      if (!ids || ids.length === 0) {
        console.log("No product IDs provided");
        return {
          success: false,
          error: "No product IDs provided",
          deletedCount: 0,
        };
      }

      // Limit the number of products that can be deleted at once
      if (ids.length > 100) {
        console.log("Too many products to delete at once");
        return {
          success: false,
          error: "Cannot delete more than 100 products at once",
          deletedCount: 0,
        };
      }

      console.log("User authenticated, creating batch delete");

      // Create a batch write
      const batch = writeBatch(this.db);
      let deletedCount = 0;

      // Add each product to the batch delete
      for (const id of ids) {
        console.log(`Processing product ID: ${id}`);
        const productRef = doc(this.getRefCollection(), id);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
          console.log(`Product ${id} exists, adding to batch delete`);
          batch.delete(productRef);
          deletedCount++;
        } else {
          console.log(`Product ${id} does not exist, skipping`);
        }
      }

      if (deletedCount === 0) {
        console.log("No products found to delete");
        return {
          success: false,
          error: "No products found to delete",
          deletedCount: 0,
        };
      }

      // Commit the batch
      console.log(`Committing batch delete for ${deletedCount} products`);
      await batch.commit();
      console.log("Batch delete committed successfully");

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      console.error(
        "[FirebaseProducts][deleteMultipleProducts] Error deleting multiple products:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        deletedCount: 0,
      };
    }
  }
}

// Export as a singleton
export const firebaseProducts = new FirebaseProducts();
export default FirebaseProducts;
