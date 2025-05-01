"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { Course, CourseInput, courseInputSchema } from "./schema";
import { deleteFromStorage } from "./storage";
import { Module, moduleInputSchema } from "./schema";

export interface ModuleAttachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

type ModuleInput = z.infer<typeof moduleInputSchema>;

/**
 * Get all courses from the courses collection
 */
export async function getAllCourses() {
  try {
    const coursesRef = adminDb.collection("courses");
    const snapshot = await coursesRef.orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      return {
        success: true,
        courses: [],
      };
    }

    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];

    return {
      success: true,
      courses,
    };
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a course by ID
 */
export async function getCourse(id: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    return {
      success: true,
      course: {
        id: doc.id,
        ...doc.data(),
      } as Course,
    };
  } catch (error) {
    console.error(`Failed to fetch course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new course
 */
export async function createCourse(data: CourseInput) {
  try {
    // Validate input data
    const validatedData = courseInputSchema.parse(data);

    // Create a reference to the courses collection
    const coursesRef = adminDb.collection("courses");

    // Generate a unique ID for the course
    const courseId = uuidv4();

    // Add timestamps
    const now = new Date().toISOString();

    const courseData = {
      ...validatedData,
      id: courseId,
      createdAt: now,
      updatedAt: now,
    };

    // Add to Firestore
    await coursesRef.doc(courseId).set(courseData);

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id: courseId,
      data: courseData,
    };
  } catch (error) {
    console.error("Failed to create course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update a course
 */
export async function updateCourse(id: string, data: Partial<CourseInput>) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Update timestamp
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    await courseRef.update(updateData);

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to update course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(id);
    const doc = await courseRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Get course data to find modules that need cleanup
    const courseData = doc.data();
    const modules = courseData?.modules || [];

    // Check if there is image data to delete
    if (courseData?.filePath) {
      // TODO: Delete course image from storage
      try {
        // Call a function to delete the image from storage
        await deleteFromStorage(courseData.filePath);
      } catch (error) {
        console.error(`Failed to delete course image:`, error);
      }
    }

    // Delete the course document first
    await courseRef.delete();

    // TODO: For production, add code to delete all module assets from storage
    // This would involve calling the Firebase Storage delete API for:
    // - `/images/${id}/modules/...` - all module images, covers and attachments

    // Revalidate the academy page
    revalidatePath("/academy");

    return {
      success: true,
      id,
      message: `Course ${id} deleted with ${modules.length} modules`,
    };
  } catch (error) {
    console.error(`Failed to delete course ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all unique tags from all courses in the database
 * This function is case-insensitive and returns normalized tags
 */
export async function getAllUniqueTags() {
  try {
    const coursesRef = adminDb.collection("courses");
    const snapshot = await coursesRef.get();

    if (snapshot.empty) {
      return {
        success: true,
        tags: [],
      };
    }

    // Collect all tags and normalize them (lowercase for case-insensitive comparison)
    const tagMap = new Map<string, string>(); // Maps lowercase tag to original case tag
    snapshot.docs.forEach((doc) => {
      const course = doc.data() as Course;
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach((tag) => {
          // Store with lowercase as key for uniqueness, but preserve original case for display
          tagMap.set(tag.toLowerCase(), tag);
        });
      }
    });

    // Get array of original-case tags, sorted alphabetically
    const uniqueTags = Array.from(tagMap.values()).sort();

    return {
      success: true,
      tags: uniqueTags,
    };
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Add a module to a course
 */
export async function addModule(courseId: string, data: ModuleInput) {
  try {
    // Validate input data
    const validatedData = moduleInputSchema.parse(data);

    // Create a reference to the course document
    const courseRef = adminDb.collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Generate a unique ID for the module
    const moduleId = uuidv4();

    // Add timestamps
    const now = new Date().toISOString();

    const moduleData = {
      ...validatedData,
      id: moduleId,
      createdAt: now,
      updatedAt: now,
    };

    // Add module to the course
    await courseRef.update({
      modules: FieldValue.arrayUnion(moduleData),
    });

    return {
      success: true,
      id: moduleId,
      data: moduleData,
    };
  } catch (error) {
    console.error("Failed to add module:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get modules for a course
 */
export async function getModules(courseId: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    const courseData = courseDoc.data();
    const modules = courseData?.modules || [];

    return {
      success: true,
      modules,
    };
  } catch (error) {
    console.error(`Failed to fetch modules for course ${courseId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update a module
 */
export async function updateModule(
  courseId: string,
  moduleId: string,
  data: Partial<ModuleInput>
) {
  try {
    const courseRef = adminDb.collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    const courseData = courseDoc.data();
    const modules = courseData?.modules || [];

    const moduleIndex = modules.findIndex((mod: Module) => mod.id === moduleId);
    if (moduleIndex === -1) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Update module data
    const now = new Date().toISOString();
    const updatedModule = {
      ...modules[moduleIndex],
      ...data,
      updatedAt: now,
    };

    modules[moduleIndex] = updatedModule;

    // Update the course document
    await courseRef.update({
      modules,
    });

    return {
      success: true,
      id: moduleId,
      data: updatedModule,
    };
  } catch (error) {
    console.error(
      `Failed to update module ${moduleId} for course ${courseId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a module
 */
export async function deleteModule(courseId: string, moduleId: string) {
  try {
    const courseRef = adminDb.collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    const courseData = courseDoc.data();
    const modules = courseData?.modules || [];

    const moduleIndex = modules.findIndex((mod: Module) => mod.id === moduleId);
    if (moduleIndex === -1) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    // Remove the module
    modules.splice(moduleIndex, 1);

    // Update the course document
    await courseRef.update({
      modules,
    });

    // TODO: Delete module files from storage
    // This would call a function to delete the directory:
    // `images/courses/${courseId}/modules/${moduleId}/`

    return {
      success: true,
      id: moduleId,
    };
  } catch (error) {
    console.error(
      `Failed to delete module ${moduleId} for course ${courseId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
