"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { Phases } from "@/lib/firebase/schema";

export interface NoteData {
  id: string;
  note_body: string;
  phases: Phases[];
  tags: string[];
  updatedAt?: number;
}

async function getNotesCollectionRef(productId: string) {
  const currentUserId = await getCurrentUserId();
  return adminDb
    .collection("products")
    .doc(currentUserId)
    .collection("products")
    .doc(productId)
    .collection("notes");
}

/**
 * Save a new note to the database
 */
export async function createNote({
  productId,
  noteBody,
  phases,
  tags,
}: {
  productId: string;
  noteBody: string;
  phases: Phases[];
  tags: string[];
}) {
  try {
    if (!productId) {
      return { success: false, error: "Missing required data" };
    }

    const noteData = {
      note_body: noteBody,
      phases,
      tags,
      updatedAt: getCurrentUnixTimestamp(),
      createdAt: getCurrentUnixTimestamp(),
      productId,
    };

    const currentUserId = await getCurrentUserId();

    // Save to Firestore
    const ref = adminDb
      .collection("products")
      .doc(currentUserId)
      .collection("products")
      .doc(productId)
      .collection("notes");

    const docRef = await ref.add(noteData);

    return {
      success: true,
      message: "Note added successfully",
      note: {
        ...noteData,
        id: docRef.id,
      },
    };
  } catch (error) {
    console.error("Error saving note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update an existing note
 */
export async function updateNote({
  productId,
  noteId,
  noteBody,
  phases,
  tags,
}: {
  productId: string;
  noteId: string;
  noteBody: string;
  phases: Phases[];
  tags: string[];
}) {
  try {
    if (!productId || !noteId || !noteBody) {
      return { success: false, error: "Missing required data" };
    }

    const noteData = {
      note_body: noteBody,
      phases,
      tags,
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Update in Firestore
    const ref = await getNotesCollectionRef(productId);
    const docRef = ref.doc(noteId);
    await docRef.update(noteData);

    revalidatePath("/notes");

    return {
      success: true,
      message: "Note updated successfully",
      note: {
        id: noteId,
        ...noteData,
      },
    };
  } catch (error) {
    console.error("Error updating note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete notes from the database
 */
export async function deleteNotes(formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const noteIdsString = formData.get("noteIds") as string;

    if (!productId || !noteIdsString) {
      return { success: false, error: "Missing required data" };
    }

    const noteIds = JSON.parse(noteIdsString) as string[];

    if (noteIds.length === 0) {
      return { success: false, error: "No notes to delete" };
    }

    const ref = await getNotesCollectionRef(productId);

    // Delete each note
    const batch = adminDb.batch();
    for (const noteId of noteIds) {
      const noteRef = ref.doc(noteId);
      batch.delete(noteRef);
    }
    await batch.commit();

    revalidatePath("/notes");

    return {
      success: true,
      message: `${noteIds.length} note(s) deleted successfully`,
      deletedIds: noteIds,
    };
  } catch (error) {
    console.error("Error deleting notes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetch notes from the database
 */
export async function fetchNotes({ productId }: { productId: string | null }) {
  try {
    if (!productId) {
      console.error("Missing productId", {
        productId,
      });
      return { success: false, error: "Missing required data" };
    }

    const notesSnapshot = await getNotesCollectionRef(productId);
    const query = await notesSnapshot.get();

    if (query.empty) {
      return { success: true, notes: [] };
    }

    const notes = query.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      notes,
    };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
