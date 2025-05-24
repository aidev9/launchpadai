import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  DocumentData,
  FirestoreDataConverter,
  collection,
  doc,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";

export abstract class FirebaseClient<T extends DocumentData> {
  protected auth!: Auth;
  protected db!: Firestore;
  protected storage!: FirebaseStorage;
  protected abstract collectionName: string;
  protected abstract converter: FirestoreDataConverter<T>;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);

      console.log(
        `[${this.constructor.name}] Initialized with collection: ${this.collectionName}`
      );
    } catch (error) {
      console.error(`[${this.constructor.name}] Initialization error:`, error);
      throw error;
    }
  }

  protected getCollectionRef() {
    return collection(this.db, this.collectionName).withConverter(
      this.converter
    );
  }

  protected getDocRef(id: string) {
    return doc(this.db, this.collectionName, id).withConverter(this.converter);
  }

  protected getSubcollectionRef(docId: string, subcollectionName: string) {
    return collection(
      this.db,
      this.collectionName,
      docId,
      subcollectionName
    ).withConverter(this.converter);
  }

  protected handleError(
    method: string,
    error: unknown,
    context: Record<string, unknown> = {}
  ): never {
    const errorMessage = `[${this.constructor.name}.${method}] Error`;
    console.error(errorMessage, { ...context, error });
    throw new Error(
      `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  protected log(method: string, message: string, data?: unknown): void {
    console.log(`[${this.constructor.name}.${method}] ${message}`, data || "");
  }
}
