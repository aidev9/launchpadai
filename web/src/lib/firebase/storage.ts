"use server";

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
export async function uploadAsset(
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

    const signedUrl = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000 * 365 * 10, // URL valid for 10 years
    });

    return {
      success: true,
      url: signedUrl,
      filePath: fileRef.name,
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

// Course Image Upload and Delete Functions
/**
 * Upload course image to Firebase Storage
 * @param courseId - The ID of the course
 * @param file - The image file to upload (as a Buffer)
 * @param fileName - The name to use for the file
 */
export async function uploadCourseImage(
  courseId: string,
  file: Buffer,
  fileName: string,
  fileType: string = "image/jpeg"
) {
  try {
    const userId = await getCurrentUserId();
    const path = `storage/${userId}/courses/${courseId}/images/${fileName}`;

    return await uploadToStorage(file, path, fileType);
  } catch (error) {
    console.error("Failed to upload course image:", error);
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
    const path = `storage/${userId}/courses/${courseId}/images/${fileName}`;

    return await deleteFromStorage(path);
  } catch (error) {
    console.error("Failed to delete course image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Module Image and Attachment Upload Functions
/**
 * Upload a module cover image to Firebase Storage
 */

export async function uploadModuleAsset(
  file: Buffer,
  courseId: string,
  moduleId: string,
  fileName: string,
  contentType: string = "image/jpeg"
) {
  try {
    const userId = await getCurrentUserId();
    const path = `storage/${userId}/courses/${courseId}/modules/${moduleId}/${fileName}`;

    return await uploadToStorage(file, path, contentType);
  } catch (error) {
    console.error("Failed to upload course image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// /**
//  * Upload a module attachment to Firebase Storage
//  */
// export async function uploadModuleAttachment(
//   buffer: Buffer,
//   courseId: string,
//   moduleId: string,
//   fileName: string,
//   contentType: string
// ) {
//   try {
//     return await uploadToStorage(
//       buffer,
//       `images/courses/${courseId}/modules/${moduleId}/attachments/${fileName}`,
//       contentType
//     );
//   } catch (error) {
//     console.error("Error uploading module attachment:", error);
//     return {
//       success: false,
//       error: "Failed to upload module attachment",
//     };
//   }
// }
