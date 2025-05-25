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
  addDoc,
  getDoc,
  updateDoc,
  doc,
  DocumentReference,
  deleteDoc,
  WithFieldValue,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Note, Phases } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating a note (without id)
type CreateNoteData = Omit<Note, "id">;

// Define a type for Firestore document data
type FirestoreNoteData = Omit<Note, "id">;

const noteConverter: FirestoreDataConverter<Note> = {
  toFirestore: (
    note: WithFieldValue<Note>
  ): WithFieldValue<FirestoreNoteData> => {
    const { id, ...rest } = note;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Note {
    const data = snapshot.data(options) as FirestoreNoteData;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseNotes {
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
      this.collectionName = "mynotes";
    } catch (error) {
      console.error("[FirebaseNotes][constructor] Error initializing:", error);
      throw error;
    }
  }

  private getRefCollection(): CollectionReference<Note> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseNotes][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(noteConverter);
  }

  private getRefDocument(id: string): DocumentReference<Note> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseNotes][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(noteConverter);
  }

  /**
   * Get all notes for the current user
   */
  getNotes(): Query<DocumentData, DocumentData> | null {
    try {
      const notesQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return notesQuery;
    } catch (error) {
      console.error("[FirebaseNotes][getNotes] Error:", error);
      return null;
    }
  }

  /**
   * Get notes by phase
   */
  getNotesByPhase(phases: Phases[]): Query<DocumentData, DocumentData> | null {
    if (phases.length === 0) {
      return null;
    }

    try {
      const notesQuery = query(
        this.getRefCollection(),
        where("phases", "array-contains-any", phases),
        orderBy("updatedAt", "desc")
      );

      return notesQuery;
    } catch (error) {
      console.error("[FirebaseNotes][getNotesByPhase] Error:", error);
      return null;
    }
  }

  /**
   * Get notes by product ID
   */
  getNotesByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!productId) {
      return null;
    }

    try {
      const notesQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return notesQuery;
    } catch (error) {
      console.error("[FirebaseNotes][getNotesByProduct] Error:", error);
      return null;
    }
  }

  /**
   * Create a new note
   */
  async createNote(noteData: CreateNoteData): Promise<Note | null> {
    try {
      const ref = this.getRefCollection();
      const data: FirestoreNoteData = {
        ...noteData,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };
      const docRef = await addDoc(ref, data);
      const docData = await getDoc(docRef);
      const savedData = docData.data();
      if (!savedData) return null;
      return { ...savedData, id: docRef.id };
    } catch (error) {
      console.error("[FirebaseNotes][createNote] Error:", error);
      return null;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(
    id: string,
    noteData: Partial<CreateNoteData>
  ): Promise<Note | null> {
    try {
      const ref = this.getRefDocument(id);
      const data: Partial<FirestoreNoteData> = {
        ...noteData,
        updatedAt: getCurrentUnixTimestamp(),
      };
      await updateDoc(ref, data);
      const docData = await getDoc(ref);
      const savedData = docData.data();
      if (!savedData) return null;
      return savedData;
    } catch (error) {
      console.error("[FirebaseNotes][updateNote] Error:", error);
      return null;
    }
  }

  /**
   * Delete a single note
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseNotes][deleteNote] Error:", error);
      return false;
    }
  }

  /**
   * Delete multiple notes using batch operation
   */
  async deleteNotes(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      ids.forEach((id) => {
        const ref = this.getRefDocument(id);
        batch.delete(ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseNotes][deleteNotes] Error:", error);
      return false;
    }
  }

  /**
   * Create multiple notes using batch operation
   */
  async createNotes(notesData: CreateNoteData[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);
      const ref = this.getRefCollection();

      notesData.forEach((noteData) => {
        const docRef = doc(ref);
        const data: FirestoreNoteData = {
          ...noteData,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        };
        batch.set(docRef, data);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseNotes][createNotes] Error:", error);
      return false;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNote(id: string): Promise<Note | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      const data = docData.data();
      if (!data) return null;
      return data;
    } catch (error) {
      console.error("[FirebaseNotes][getNote] Error:", error);
      return null;
    }
  }
}

// Export as a singleton
export const firebaseNotes = new FirebaseNotes();
export default FirebaseNotes;
