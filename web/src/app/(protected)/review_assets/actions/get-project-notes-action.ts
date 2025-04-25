"use server";

// import { z } from "zod";
import { getProjectNotes } from "@/lib/firebase/notes";

// Get all notes for a specific project (server action wrapper)
export async function getProjectNotesAction(productId: string) {
  try {
    // Call the Firestore function
    const response = await getProjectNotes(productId);
    return response;
  } catch (error) {
    console.error("Error in getProjectNotesAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
