"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  saveNote as saveNoteToFirebase,
  deleteNote as deleteNoteFromFirebase,
} from "@/lib/firebase/notes";

// Schema for saving notes
const saveNoteSchema = z.object({
  productId: z.string(),
  note: z.object({
    id: z.string(),
    note_body: z.string(),
  }),
});

// Define server action for saving notes
export async function saveNoteAction(data: z.infer<typeof saveNoteSchema>) {
  try {
    const { productId, note } = data;

    // Call the Firestore function
    const response = await saveNoteToFirebase(productId, note);

    // Revalidate the review assets page (this only works in server actions)
    revalidatePath("/review_assets");

    return response;
  } catch (error) {
    console.error("Error in saveNoteAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Schema for deleting notes
const deleteNoteSchema = z.object({
  projectId: z.string(),
  noteId: z.string(),
});

// Define server action for deleting notes
export async function deleteNoteAction(data: z.infer<typeof deleteNoteSchema>) {
  try {
    const { projectId, noteId } = data;

    // Call the Firestore function
    const response = await deleteNoteFromFirebase(projectId, noteId);

    // Revalidate the review assets page (this only works in server actions)
    revalidatePath("/review_assets");

    return response;
  } catch (error) {
    console.error("Error in deleteNoteAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
