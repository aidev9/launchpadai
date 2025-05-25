"use server";

import { adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/firebase/schema";

/**
 * Get user's products
 */
export async function getUserProducts(userId: string) {
  try {
    const productsSnapshot = await adminDb
      .collection("products")
      .where("userId", "==", userId)
      .get();

    if (productsSnapshot.empty) {
      return { success: true, products: [] };
    }

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, products };
  } catch (error) {
    console.error(`Error fetching products for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's prompts
 * TODO: This must be refactored
 */
export async function getUserPrompts(userId: string) {
  try {
    const promptsSnapshot = await adminDb
      .collection("myprompts")
      .doc(userId)
      .collection("myprompts")
      .get();

    if (promptsSnapshot.empty) {
      return { success: true, prompts: [] };
    }

    const prompts = promptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, prompts };
  } catch (error) {
    console.error(`Error fetching prompts for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's tech stacks
 */
export async function getUserTechStacks(userId: string) {
  try {
    const techStacksSnapshot = await adminDb
      .collection("techStacks")
      .where("userId", "==", userId)
      .get();

    if (techStacksSnapshot.empty) {
      return { success: true, techStacks: [] };
    }

    const techStacks = techStacksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, techStacks };
  } catch (error) {
    console.error(`Error fetching tech stacks for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string) {
  try {
    const subscriptionSnapshot = await adminDb
      .collection("subscriptions")
      .where("userId", "==", userId)
      .get();

    if (subscriptionSnapshot.empty) {
      return { success: true, subscription: null };
    }

    const subscription = {
      id: subscriptionSnapshot.docs[0].id,
      ...subscriptionSnapshot.docs[0].data(),
    };

    return { success: true, subscription };
  } catch (error) {
    console.error(`Error fetching subscription for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all user data in one call
 */
export async function getUserAllData(userId: string) {
  try {
    console.log("[getUserAllData] Fetching all data for user:", userId);

    const [
      productsResult,
      promptsResult,
      techStacksResult,
      subscriptionResult,
    ] = await Promise.all([
      getUserProducts(userId),
      getUserPrompts(userId),
      getUserTechStacks(userId),
      getUserSubscription(userId),
    ]);

    console.log("[getUserAllData] Results:", {
      products: productsResult.success,
      prompts: promptsResult.success,
      techStacks: techStacksResult.success,
      subscription: subscriptionResult.success,
    });

    return {
      success: true,
      products: productsResult.success ? productsResult.products : [],
      prompts: promptsResult.success ? promptsResult.prompts : [],
      techStacks: techStacksResult.success ? techStacksResult.techStacks : [],
      subscription: subscriptionResult.success
        ? subscriptionResult.subscription
        : null,
    };
  } catch (error) {
    console.error(
      `[getUserAllData] Error fetching all data for user ${userId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
