"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { TechStack, TechStackInput, techStackInputSchema } from "./schema";
import { generateDefaultAssets } from "./techstack-assets";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Get the techStacksRef for a specific user
function getUserTechStacksRef(userId: string) {
  return adminDb.collection("mystacks").doc(userId).collection("mystacks");
}

/**
 * Create a new tech stack
 * TODO: Fix this
 */
export async function createTechStack(data: TechStack) {
  try {
    // Validate input data
    const validatedData = techStackInputSchema.parse(data);
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    // Add timestamps
    const timestamp = getCurrentUnixTimestamp();
    const techStackData = {
      ...validatedData,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Add to Firestore
    const docRef = await techStacksRef.add(techStackData);
    const techStackId = docRef.id;

    // Start generating default assets in the background without awaiting
    // This allows us to return immediately and let the assets generate asynchronously
    // TODO: We will refactor this to use a queue system in the future
    // generateDefaultAssets(techStackId, validatedData.name).catch(
    //   (assetError) => {
    //     console.error(
    //       `Failed to generate default assets for tech stack ${techStackId}:`,
    //       assetError
    //     );
    //   }
    // );

    // Revalidate relevant paths
    revalidatePath("/mystacks/create");
    revalidatePath("/mystacks");

    return {
      success: true,
      id: techStackId,
      data: { ...techStackData, id: techStackId },
    };
  } catch (error) {
    console.error("Failed to create tech stack:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all tech stacks for the current user
 */
export async function getAllTechStacks() {
  try {
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    const snapshot = await techStacksRef.orderBy("updatedAt", "desc").get();

    const techStacks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TechStack[];

    return {
      success: true,
      techStacks,
    };
  } catch (error) {
    console.error("Failed to fetch tech stacks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single tech stack by ID
 */
export async function getTechStack(id: string) {
  try {
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    const techStackDoc = await techStacksRef.doc(id).get();

    if (!techStackDoc.exists) {
      return {
        success: false,
        error: "Tech stack not found",
      };
    }

    return {
      success: true,
      techStack: {
        id: techStackDoc.id,
        ...techStackDoc.data(),
      } as TechStack,
    };
  } catch (error) {
    console.error(`Failed to fetch tech stack ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update an existing tech stack
 * TODO: Fix this
 */
export async function updateTechStack(data: TechStack) {
  try {
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    // Update with new data and updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
    };

    await techStacksRef.doc(data.id).update(updateData);

    // Revalidate relevant paths
    revalidatePath("/mystacks/create");
    revalidatePath("/mystacks");

    return {
      success: true,
      id: data.id,
      data: updateData,
    };
  } catch (error) {
    console.error(`Failed to update tech stack ${data.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a tech stack
 */
export async function deleteTechStack(id: string) {
  try {
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    // Check if tech stack exists
    const techStackDoc = await techStacksRef.doc(id).get();
    if (!techStackDoc.exists) {
      return {
        success: false,
        error: "Tech stack not found",
      };
    }

    // Delete the tech stack
    await techStacksRef.doc(id).delete();

    // Revalidate relevant paths
    revalidatePath("/mystacks/create");
    revalidatePath("/mystacks");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to delete tech stack ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete multiple tech stacks
 */
export async function deleteMultipleTechStacks(ids: string[]) {
  try {
    const userId = await getCurrentUserId();
    const techStacksRef = getUserTechStacksRef(userId);

    // Create a batch write
    const batch = adminDb.batch();
    let deletedCount = 0;

    // Add each tech stack to the batch
    for (const id of ids) {
      const techStackDoc = await techStacksRef.doc(id).get();
      if (techStackDoc.exists) {
        batch.delete(techStacksRef.doc(id));
        deletedCount++;
      }
    }

    // Commit the batch
    await batch.commit();

    // Revalidate relevant paths
    revalidatePath("/mystacks/create");
    revalidatePath("/mystacks");

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error("Failed to delete tech stacks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
