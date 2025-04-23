import { adminDb } from "./admin";
import { getCurrentUserId } from "./adminAuth";

export interface Note {
  id: string;
  note_body: string;
  last_modified: Date;
}

// Helper function inline to avoid import issues
function serializeFirestoreData(data: any): any {
  if (!data) return data;

  const result: any = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    // Check if value is a Firestore timestamp
    if (
      value &&
      typeof value === "object" &&
      value.toDate instanceof Function
    ) {
      // Convert to ISO string
      result[key] = value.toDate().toISOString();
    }
    // Check if value is an object (but not an array)
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Recursively serialize nested objects
      result[key] = serializeFirestoreData(value);
    } else {
      // Pass through other values
      result[key] = value;
    }
  });

  return result;
}

// Get the notes reference for a specific user and project
function getUserNoteRef(userId: string, projectId: string) {
  return adminDb
    .collection("notes")
    .doc(userId)
    .collection("products")
    .doc(projectId)
    .collection("notes");
}

/**
 * Create or update a note
 */
export async function saveNote(
  projectId: string,
  noteData: Partial<Note> & { id: string }
) {
  try {
    const userId = await getCurrentUserId();
    const notesRef = getUserNoteRef(userId, projectId);

    const now = new Date();
    const noteWithTimestamp = {
      ...noteData,
      last_modified: now,
    };

    await notesRef.doc(noteData.id).set(noteWithTimestamp, { merge: true });

    return {
      success: true,
      note: {
        ...noteWithTimestamp,
      },
    };
  } catch (error) {
    console.error(`Failed to save note:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all notes for a specific project
 */
export async function getProjectNotes(projectId: string) {
  try {
    const userId = await getCurrentUserId();
    const notesRef = getUserNoteRef(userId, projectId);

    const snapshot = await notesRef.orderBy("last_modified", "desc").get();

    // Serialize each note document to handle timestamps
    const notes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...serializeFirestoreData(data),
      };
    });

    return {
      success: true,
      notes,
    };
  } catch (error) {
    console.error(`Failed to fetch notes for project ${projectId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single note by ID
 */
export async function getNote(projectId: string, noteId: string) {
  try {
    const userId = await getCurrentUserId();
    const notesRef = getUserNoteRef(userId, projectId);

    const noteDoc = await notesRef.doc(noteId).get();

    if (!noteDoc.exists) {
      return {
        success: false,
        error: "Note not found",
      };
    }

    // Serialize the note document to handle timestamps
    const data = noteDoc.data();
    return {
      success: true,
      note: {
        id: noteDoc.id,
        ...serializeFirestoreData(data),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch note ${noteId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a note
 */
export async function deleteNote(projectId: string, noteId: string) {
  try {
    const userId = await getCurrentUserId();
    const notesRef = getUserNoteRef(userId, projectId);

    await notesRef.doc(noteId).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
