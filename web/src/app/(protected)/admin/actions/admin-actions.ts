"use server";

import { adminDb } from "@/lib/firebase/admin";
import {
  User,
  Product,
  Prompt,
  Stack,
  Collection,
  Agent,
  ActivityData,
  AdminStats,
} from "../types/admin-types";

// Import Firebase types for proper typing
import type {
  Query,
  CollectionReference,
  DocumentData,
  OrderByDirection,
  CollectionGroup,
} from "firebase-admin/firestore";

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<{
  success: boolean;
  stats?: AdminStats;
  error?: string;
}> {
  try {
    // Get counts for each entity type
    const [usersSnapshot, productsSnapshot] = await Promise.all([
      adminDb.collection("users").count().get(),
      adminDb.collection("products").count().get(),
    ]);

    // For prompts, we need to count manually due to nested structure
    let totalPrompts = 0;
    let newPrompts = 0;

    const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;

    try {
      const mypromptsSnapshot = await adminDb.collection("myprompts").get();

      for (const userDoc of mypromptsSnapshot.docs) {
        const userPromptsSnapshot = await adminDb
          .collection("myprompts")
          .doc(userDoc.id)
          .collection("myprompts")
          .get();

        totalPrompts += userPromptsSnapshot.docs.length;

        // Count new prompts in the last 7 days
        userPromptsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt || 0;
          if (createdAt >= sevenDaysAgo) {
            newPrompts++;
          }
        });
      }
    } catch (promptError) {
      console.warn("Error counting prompts:", promptError);
    }

    // For now, use placeholder counts for other collections that might not exist yet
    const stats: AdminStats = {
      users: {
        total: usersSnapshot.data().count,
        active: Math.floor(usersSnapshot.data().count * 0.7), // Approximation
        new: 0, // We'd need to count manually if needed
        trending: 0, // Users don't have a trending metric
      },
      products: {
        total: productsSnapshot.data().count,
        active: Math.floor(productsSnapshot.data().count * 0.6),
        new: 0, // We'd need to count manually if needed
        trending: 0,
      },
      prompts: {
        total: totalPrompts,
        active: Math.floor(totalPrompts * 0.5),
        new: newPrompts,
        trending: Math.floor(newPrompts * 0.4),
      },
      stacks: {
        total: 0, // Placeholder
        active: 0,
        new: 0,
        trending: 0,
      },
      collections: {
        total: 0, // Placeholder
        active: 0,
        new: 0,
        trending: 0,
      },
      agents: {
        total: 0, // Placeholder
        active: 0,
        new: 0,
        trending: 0,
      },
    };

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get users with pagination, sorting, and filtering
 */
export async function getUsers(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection: OrderByDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  users?: User[];
  totalUsers?: number;
  error?: string;
}> {
  try {
    // Start with base query - use any to avoid type conflicts
    let query: any = adminDb.collection("users");

    // Apply filters
    if (filters.email) {
      query = query
        .where("email", ">=", filters.email)
        .where("email", "<=", filters.email + "\uf8ff");
    }

    if (filters.isAdmin === true || filters.isAdmin === false) {
      query = query.where("isAdmin", "==", filters.isAdmin);
    }

    // Apply sorting
    query = query.orderBy(sortField, sortDirection);

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const totalUsers = totalSnapshot.data().count;

    // Apply pagination
    query = query.limit(pageSize).offset((page - 1) * pageSize);

    // Execute query
    const usersSnapshot = await query.get();

    const users = usersSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];

    return {
      success: true,
      users,
      totalUsers,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get products with pagination, sorting, and filtering
 */
export async function getProducts(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection: OrderByDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  products?: Product[];
  totalProducts?: number;
  error?: string;
}> {
  try {
    // Start with base query - use any to avoid type conflicts
    let query: any = adminDb.collection("products");

    // Apply filters
    if (filters.title) {
      query = query
        .where("title", ">=", filters.title)
        .where("title", "<=", filters.title + "\uf8ff");
    }

    if (filters.userId) {
      query = query.where("userId", "==", filters.userId);
    }

    if (filters.isPublic === true || filters.isPublic === false) {
      query = query.where("isPublic", "==", filters.isPublic);
    }

    // Apply sorting
    query = query.orderBy(sortField, sortDirection);

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const totalProducts = totalSnapshot.data().count;

    // Apply pagination
    query = query.limit(pageSize).offset((page - 1) * pageSize);

    // Execute query
    const productsSnapshot = await query.get();

    const products = productsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Fetch user details for each product
    const userIds = [
      ...new Set(products.map((product) => product.userId).filter(Boolean)),
    ];
    const userDetails: Record<string, User> = {};

    if (userIds.length > 0) {
      const userSnapshots = await Promise.all(
        userIds.map((userId) => adminDb.collection("users").doc(userId).get())
      );

      userSnapshots.forEach((snapshot) => {
        if (snapshot.exists) {
          userDetails[snapshot.id] = {
            id: snapshot.id,
            ...snapshot.data(),
          } as User;
        }
      });
    }

    // Attach user details to products
    const productsWithUsers = products.map((product) => ({
      ...product,
      user: product.userId ? userDetails[product.userId] : undefined,
    }));

    return {
      success: true,
      products: productsWithUsers,
      totalProducts,
    };
  } catch (error) {
    console.error("Error getting products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get prompts with pagination, sorting, and filtering
 */
export async function getPrompts(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  prompts?: Prompt[];
  totalPrompts?: number;
  error?: string;
}> {
  try {
    console.log("Getting prompts from nested myprompts structure...");

    // The actual structure is: myprompts/{userId}/myprompts/{promptId}
    // First, get all user documents from the myprompts collection
    const mypromptsSnapshot = await adminDb.collection("myprompts").get();

    console.log(`Found ${mypromptsSnapshot.docs.length} users with prompts`);

    if (mypromptsSnapshot.empty) {
      console.log("No users with prompts found in database");
      return {
        success: true,
        prompts: [],
        totalPrompts: 0,
      };
    }

    // Collect all prompts from all users
    const allPrompts: any[] = [];

    for (const userDoc of mypromptsSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // Get prompts subcollection for this user
        const userPromptsSnapshot = await adminDb
          .collection("myprompts")
          .doc(userId)
          .collection("myprompts")
          .get();

        console.log(
          `User ${userId} has ${userPromptsSnapshot.docs.length} prompts`
        );

        // Process each prompt for this user
        userPromptsSnapshot.docs.forEach((promptDoc: DocumentData) => {
          const data = promptDoc.data();
          allPrompts.push({
            id: promptDoc.id,
            userId,
            title: data.title || "Untitled Prompt",
            content: data.body || data.content || "",
            isPublic: data.isPublic || false,
            views: Number(data.views || 0),
            likes: Number(data.likes || 0),
            createdAt: data.createdAt || Date.now() / 1000,
            updatedAt: data.updatedAt || Date.now() / 1000,
            // Include other fields that might exist
            phaseTags: data.phaseTags || [],
            productTags: data.productTags || [],
            tags: data.tags || [],
            sourcePromptId: data.sourcePromptId,
          });
        });
      } catch (userError) {
        console.warn(`Error getting prompts for user ${userId}:`, userError);
      }
    }

    console.log(`Total prompts collected: ${allPrompts.length}`);

    // Apply filters
    let filteredPrompts = allPrompts;

    if (filters.isPublic === true || filters.isPublic === false) {
      filteredPrompts = filteredPrompts.filter(
        (prompt: any) => prompt.isPublic === filters.isPublic
      );
    }

    if (filters.title) {
      const searchTerm = filters.title.toLowerCase();
      filteredPrompts = filteredPrompts.filter(
        (prompt: any) =>
          prompt.title?.toLowerCase().includes(searchTerm) ||
          prompt.content?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.userId) {
      filteredPrompts = filteredPrompts.filter(
        (prompt: any) => prompt.userId === filters.userId
      );
    }

    // Sort the results
    filteredPrompts.sort((a: any, b: any) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;

      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex);

    // Fetch user details for the paginated prompts
    const userIds = [
      ...new Set(
        paginatedPrompts.map((prompt: any) => prompt.userId).filter(Boolean)
      ),
    ];
    const userDetails: Record<string, any> = {};

    if (userIds.length > 0) {
      try {
        const userPromises = userIds.map(async (userId: string) => {
          const userDoc = await adminDb.collection("users").doc(userId).get();
          if (userDoc.exists) {
            return { id: userId, ...userDoc.data() };
          }
          return null;
        });

        const users = await Promise.all(userPromises);
        users.forEach((user: any) => {
          if (user) {
            userDetails[user.id] = user;
          }
        });
      } catch (userError) {
        console.warn("Error fetching user details:", userError);
      }
    }

    // Attach user details to prompts
    const promptsWithUsers = paginatedPrompts.map((prompt: any) => ({
      ...prompt,
      user: prompt.userId ? userDetails[prompt.userId] : undefined,
    }));

    console.log(
      `Returning ${promptsWithUsers.length} prompts out of ${filteredPrompts.length} total`
    );

    return {
      success: true,
      prompts: promptsWithUsers as Prompt[],
      totalPrompts: filteredPrompts.length,
    };
  } catch (error) {
    console.error("Error getting prompts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get stacks with pagination, sorting, and filtering
 */
export async function getStacks(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection: OrderByDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  stacks?: Stack[];
  totalStacks?: number;
  error?: string;
}> {
  try {
    // Start with base query
    let query: Query<DocumentData, DocumentData> =
      adminDb.collection("mystacks");

    // Apply filters
    if (filters.title) {
      query = query
        .where("title", ">=", filters.title)
        .where("title", "<=", filters.title + "\uf8ff");
    }

    if (filters.userId) {
      query = query.where("userId", "==", filters.userId);
    }

    if (filters.isPublic === true || filters.isPublic === false) {
      query = query.where("isPublic", "==", filters.isPublic);
    }

    // Apply sorting
    query = query.orderBy(sortField, sortDirection);

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const totalStacks = totalSnapshot.data().count;

    // Apply pagination
    query = query.limit(pageSize).offset((page - 1) * pageSize);

    // Execute query
    const stacksSnapshot = await query.get();

    const stacks = stacksSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as Stack[];

    // Fetch user details for each stack
    const userIds = [
      ...new Set(stacks.map((stack) => stack.userId).filter(Boolean)),
    ];
    const userDetails: Record<string, User> = {};

    if (userIds.length > 0) {
      const userSnapshots = await Promise.all(
        userIds.map((userId) => adminDb.collection("users").doc(userId).get())
      );

      userSnapshots.forEach((snapshot) => {
        if (snapshot.exists) {
          userDetails[snapshot.id] = {
            id: snapshot.id,
            ...snapshot.data(),
          } as User;
        }
      });
    }

    // Attach user details to stacks
    const stacksWithUsers = stacks.map((stack) => ({
      ...stack,
      user: stack.userId ? userDetails[stack.userId] : undefined,
    }));

    return {
      success: true,
      stacks: stacksWithUsers,
      totalStacks,
    };
  } catch (error) {
    console.error("Error getting stacks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get collections with pagination, sorting, and filtering
 */
export async function getCollections(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  collections?: Collection[];
  totalCollections?: number;
  error?: string;
}> {
  try {
    console.log("Getting collections using FirebaseAdminCollections...");

    // Use collectionGroup to query across all users
    let collectionsQuery: Query<DocumentData> =
      adminDb.collectionGroup("collections");

    // Apply filters
    if (filters.title) {
      collectionsQuery = collectionsQuery
        .where("title", ">=", filters.title)
        .where("title", "<=", filters.title + "\uf8ff");
    }

    if (filters.userId) {
      collectionsQuery = collectionsQuery.where("userId", "==", filters.userId);
    }

    if (filters.isPublic === true || filters.isPublic === false) {
      collectionsQuery = collectionsQuery.where(
        "isPublic",
        "==",
        filters.isPublic
      );
    }

    // Apply sorting
    collectionsQuery = collectionsQuery.orderBy(
      sortField,
      sortDirection as "asc" | "desc"
    );

    // Get total count for pagination
    const totalSnapshot = await collectionsQuery.count().get();
    const totalCollections = totalSnapshot.data().count;

    console.log(`Found ${totalCollections} total collections across all users`);

    // Apply pagination
    collectionsQuery = collectionsQuery
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Execute query
    const collectionsSnapshot = await collectionsQuery.get();

    console.log(
      `Retrieved ${collectionsSnapshot.docs.length} collections for page ${page}`
    );

    const collections = collectionsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as Collection[];

    // Fetch user details for each collection
    const userIds = [
      ...new Set(
        collections.map((collection) => collection.userId).filter(Boolean)
      ),
    ];
    const userDetails: Record<string, User> = {};

    if (userIds.length > 0) {
      const userSnapshots = await Promise.all(
        userIds.map((userId) => adminDb.collection("users").doc(userId).get())
      );

      userSnapshots.forEach((snapshot) => {
        if (snapshot.exists) {
          userDetails[snapshot.id] = {
            id: snapshot.id,
            ...snapshot.data(),
          } as User;
        }
      });
    }

    // Attach user details to collections
    const collectionsWithUsers = collections.map((collection) => ({
      ...collection,
      user: collection.userId ? userDetails[collection.userId] : undefined,
    }));

    return {
      success: true,
      collections: collectionsWithUsers,
      totalCollections,
    };
  } catch (error) {
    console.error("Error getting collections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get agents with pagination, sorting, and filtering
 */
export async function getAgents(
  page = 1,
  pageSize = 10,
  sortField = "createdAt",
  sortDirection = "desc",
  filters: Record<string, any> = {}
): Promise<{
  success: boolean;
  agents?: Agent[];
  totalAgents?: number;
  error?: string;
}> {
  try {
    console.log("Getting agents using collectionGroup across all users...");

    // Use collectionGroup to query across all users
    let agentsQuery: Query<DocumentData> = adminDb.collectionGroup("myagents");

    // Apply filters
    if (filters.title) {
      agentsQuery = agentsQuery
        .where("title", ">=", filters.title)
        .where("title", "<=", filters.title + "\uf8ff");
    }

    if (filters.userId) {
      agentsQuery = agentsQuery.where("userId", "==", filters.userId);
    }

    if (filters.isPublic === true || filters.isPublic === false) {
      agentsQuery = agentsQuery.where("isPublic", "==", filters.isPublic);
    }

    // Apply sorting
    agentsQuery = agentsQuery.orderBy(
      sortField,
      sortDirection as "asc" | "desc"
    );

    // Get total count for pagination
    const totalSnapshot = await agentsQuery.count().get();
    const totalAgents = totalSnapshot.data().count;

    console.log(`Found ${totalAgents} total agents across all users`);

    // Apply pagination
    agentsQuery = agentsQuery.limit(pageSize).offset((page - 1) * pageSize);

    // Execute query
    const agentsSnapshot = await agentsQuery.get();

    console.log(
      `Retrieved ${agentsSnapshot.docs.length} agents for page ${page}`
    );

    const agents = agentsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as Agent[];

    // Fetch user details for each agent
    const userIds = [
      ...new Set(agents.map((agent) => agent.userId).filter(Boolean)),
    ];
    const userDetails: Record<string, User> = {};

    if (userIds.length > 0) {
      const userSnapshots = await Promise.all(
        userIds.map((userId) => adminDb.collection("users").doc(userId).get())
      );

      userSnapshots.forEach((snapshot) => {
        if (snapshot.exists) {
          userDetails[snapshot.id] = {
            id: snapshot.id,
            ...snapshot.data(),
          } as User;
        }
      });
    }

    // Attach user details to agents
    const agentsWithUsers = agents.map((agent) => ({
      ...agent,
      user: agent.userId ? userDetails[agent.userId] : undefined,
    }));

    return {
      success: true,
      agents: agentsWithUsers,
      totalAgents,
    };
  } catch (error) {
    console.error("Error getting agents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get activity data for the dashboard
 */
export async function getActivityData(days = 30): Promise<{
  success: boolean;
  activityData?: ActivityData[];
  error?: string;
}> {
  try {
    // Calculate timestamp for X days ago
    const startTimestamp = Date.now() / 1000 - days * 24 * 60 * 60;

    // Group by day
    const activityByDay: Record<
      string,
      {
        signups: number;
        products: number;
        prompts: number;
        stacks: number;
        collections: number;
        agents: number;
      }
    > = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      activityByDay[dateString] = {
        signups: 0,
        products: 0,
        prompts: 0,
        stacks: 0,
        collections: 0,
        agents: 0,
      };
    }

    try {
      // Get user sign-ups in the period
      const usersSnapshot = await adminDb
        .collection("users")
        .where("createdAt", ">=", startTimestamp)
        .get();

      // Count sign-ups by day
      usersSnapshot.docs.forEach((doc: DocumentData) => {
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

    // Get entity creations in the period
    const entityTypes = [
      { name: "products", collection: "products" },
      { name: "prompts", collection: "myprompts" },
      { name: "stacks", collection: "mystacks" },
      { name: "collections", collection: "mycollections" },
      { name: "agents", collection: "myagents" },
    ];

    for (const entityType of entityTypes) {
      try {
        const snapshot = await adminDb
          .collection(entityType.collection)
          .where("createdAt", ">=", startTimestamp)
          .get();

        snapshot.docs.forEach((doc: DocumentData) => {
          const timestamp = doc.data().createdAt;
          if (timestamp) {
            const date = new Date(timestamp * 1000).toISOString().split("T")[0];
            if (activityByDay[date]) {
              activityByDay[date][
                entityType.name as keyof (typeof activityByDay)[string]
              ]++;
            }
          }
        });
      } catch (error) {
        console.error(`Error getting ${entityType.name}:`, error);
      }
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
    console.error("Error getting activity data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await adminDb.collection("users").doc(userId).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete an entity (product, prompt, stack, collection, agent)
 */
export async function deleteEntity(
  entityType:
    | "products"
    | "myprompts"
    | "mystacks"
    | "mycollections"
    | "myagents",
  entityId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (entityType === "products") {
      // Products are in a flat collection
      await adminDb.collection(entityType).doc(entityId).delete();
    } else {
      // For user-specific entities, we need to find the document across all subcollections
      const collectionGroupQuery: Query<DocumentData> =
        adminDb.collectionGroup(entityType);
      const snapshot = await collectionGroupQuery
        .where("__name__", "==", entityId)
        .get();

      if (!snapshot.empty) {
        // Delete the first (and should be only) matching document
        await snapshot.docs[0].ref.delete();
      } else {
        throw new Error(`Entity ${entityId} not found in ${entityType}`);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting ${entityType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update user properties
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Remove id from updates if present
    const { id, ...updatesWithoutId } = updates;

    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        ...updatesWithoutId,
        updatedAt: Date.now() / 1000,
      });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update entity properties
 */
export async function updateEntity(
  entityType:
    | "products"
    | "myprompts"
    | "mystacks"
    | "mycollections"
    | "myagents",
  entityId: string,
  updates: Record<string, any>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Remove id from updates if present
    const { id, ...updatesWithoutId } = updates;

    if (entityType === "products") {
      // Products are in a flat collection
      await adminDb
        .collection(entityType)
        .doc(entityId)
        .update({
          ...updatesWithoutId,
          updatedAt: Date.now() / 1000,
        });
    } else {
      // For user-specific entities, we need to find the document across all subcollections
      const collectionGroupQuery: Query<DocumentData> =
        adminDb.collectionGroup(entityType);
      const snapshot = await collectionGroupQuery
        .where("__name__", "==", entityId)
        .get();

      if (!snapshot.empty) {
        // Update the first (and should be only) matching document
        await snapshot.docs[0].ref.update({
          ...updatesWithoutId,
          updatedAt: Date.now() / 1000,
        });
      } else {
        throw new Error(`Entity ${entityId} not found in ${entityType}`);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error updating ${entityType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
