"use server";

import { adminDb } from "./admin";
import { getStorage } from "firebase-admin/storage";
import { getCurrentUserId } from "./adminAuth";
import { adminApp } from "./admin";

// Get Firebase Storage instance
const adminStorage = getStorage(adminApp);
// Explicitly specify the bucket name from environment variables
const bucket = adminStorage.bucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload (as a Buffer)
 * @param path - The path to store the file at in Firebase Storage
 * @param contentType - The content type of the file
 */
export async function uploadToStorage(
  file: Buffer,
  path: string,
  contentType: string
) {
  try {
    // Create a file in the bucket with the specified path
    const fileRef = bucket.file(path);

    // Upload the file
    await fileRef.save(file, {
      metadata: {
        contentType,
      },
      resumable: false,
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error(`Failed to upload file to ${path}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Upload course image to Firebase Storage
 * @param courseId - The ID of the course
 * @param file - The image file to upload (as a Buffer)
 * @param fileName - The name to use for the file
 */
export async function uploadCourseImage(
  courseId: string,
  file: Buffer,
  fileName: string
) {
  try {
    const userId = await getCurrentUserId();
    const path = `images/${userId}/courses/${courseId}/${fileName}`;

    return await uploadToStorage(file, path, "image/jpeg");
  } catch (error) {
    console.error("Failed to upload course image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path - The path of the file to delete in Firebase Storage
 */
export async function deleteFromStorage(path: string) {
  try {
    // Get a reference to the file
    const fileRef = bucket.file(path);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return {
        success: false,
        error: "File does not exist",
      };
    }

    // Delete the file
    await fileRef.delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Failed to delete file at ${path}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a course image from Firebase Storage
 * @param courseId - The ID of the course
 * @param fileName - The name of the file to delete
 */
export async function deleteCourseImage(courseId: string, fileName: string) {
  try {
    const userId = await getCurrentUserId();
    const path = `images/${userId}/courses/${courseId}/${fileName}`;

    return await deleteFromStorage(path);
  } catch (error) {
    console.error("Failed to delete course image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
