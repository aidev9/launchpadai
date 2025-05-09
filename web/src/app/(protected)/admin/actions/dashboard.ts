"use server";

import { adminDb } from "@/lib/firebase/admin";

/**
 * Get total users count from Firestore
 */
export async function getTotalUsers() {
  try {
    const usersSnapshot = await adminDb.collection("users").count().get();
    return {
      success: true,
      count: usersSnapshot.data().count,
    };
  } catch (error) {
    console.error("Error getting total users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get total courses count from Firestore
 */
export async function getTotalCourses() {
  try {
    const coursesSnapshot = await adminDb.collection("courses").count().get();
    return {
      success: true,
      count: coursesSnapshot.data().count,
    };
  } catch (error) {
    console.error("Error getting total courses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get recent sign-ups (users created in the last 7 days)
 */
export async function getRecentSignups(limit = 5) {
  try {
    // Calculate timestamp for 7 days ago
    const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;

    const recentUsersSnapshot = await adminDb
      .collection("users")
      .where("createdAt", ">=", sevenDaysAgo)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const users = recentUsersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("Error getting recent sign-ups:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get recent products created by users
 */
export async function getRecentProducts(limit = 20) {
  try {
    const recentProductsSnapshot = await adminDb
      .collectionGroup("products")
      .limit(limit)
      .get();

    const products = recentProductsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Use the userId field from the document data
        userId: data.userId || doc.ref.path.split("/")[1] || "",
      };
    });

    // Attach user details to products
    const productsWithUsers = products.map((product) => ({
      ...product,
      user: product.userId,
    }));
    return {
      success: true,
      products: productsWithUsers,
    };
  } catch (error) {
    console.error("Error getting recent products:", error);
    // Return empty products array instead of failing
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get recent prompts created by users
 * TODO: Fix this function
 */
export async function getRecentPrompts(limit = 20) {
  try {
    const recentPromptsSnapshot = await adminDb
      .collectionGroup("myprompts")
      .limit(limit)
      .get();

    const prompts = recentPromptsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Use the userId field from the document data
        userId: data.userId || doc.ref.path.split("/")[1] || "",
      };
    });

    // Attach user details to prompts
    const promptsWithUsers = prompts.map((prompt) => ({
      ...prompt,
      user: prompt.userId,
    }));
    return {
      success: true,
      prompts: promptsWithUsers,
    };
  } catch (error) {
    console.error("Error getting recent prompts:", error);
    return {
      success: false,
      prompts: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user activity data (sign-ups, product creations, prompt creations)
 */
export async function getUserActivityData(days = 30) {
  try {
    // Calculate timestamp for X days ago
    const startTimestamp = Date.now() / 1000 - days * 24 * 60 * 60;

    // Group by day
    const activityByDay: Record<
      string,
      { signups: number; products: number; prompts: number }
    > = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      activityByDay[dateString] = { signups: 0, products: 0, prompts: 0 };
    }

    try {
      // Get user sign-ups in the period
      const usersSnapshot = await adminDb
        .collection("users")
        .where("createdAt", ">=", startTimestamp)
        .get();

      // Count sign-ups by day
      usersSnapshot.docs.forEach((doc) => {
        const timestamp = doc.data().createdAt;
        if (timestamp) {
          const date = new Date(timestamp * 1000).toISOString().split("T")[0];
          if (activityByDay[date]) {
            activityByDay[date].signups++;
          }
        }
      });
    } catch (error) {
      console.error("Error getting user sign-ups:", error);
    }

    // Skip products query as it requires a composite index
    // Instead, we'll just use the recent products data
    try {
      // Get recent products (last 100)
      const recentProductsSnapshot = await adminDb
        .collection("products")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      // Count products by day if they're within the time range
      recentProductsSnapshot.docs.forEach((doc) => {
        const timestamp = doc.data().createdAt;
        if (timestamp && timestamp >= startTimestamp) {
          const date = new Date(timestamp * 1000).toISOString().split("T")[0];
          if (activityByDay[date]) {
            activityByDay[date].products++;
          }
        }
      });
    } catch (error) {
      console.error("Error getting recent products:", error);
    }

    try {
      // Get prompts created in the period
      const promptsSnapshot = await adminDb
        .collection("myprompts")
        .where("createdAt", ">=", startTimestamp)
        .get();

      // Count prompts by day
      promptsSnapshot.docs.forEach((doc) => {
        const timestamp = doc.data().createdAt;
        if (timestamp) {
          const date = new Date(timestamp * 1000).toISOString().split("T")[0];
          if (activityByDay[date]) {
            activityByDay[date].prompts++;
          }
        }
      });
    } catch (error) {
      console.error("Error getting prompts:", error);
    }

    // Convert to array format for charting
    const activityData = Object.entries(activityByDay)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      activityData,
    };
  } catch (error) {
    console.error("Error getting user activity data:", error);
    // Return empty activity data instead of failing completely
    return {
      success: true,
      activityData: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
