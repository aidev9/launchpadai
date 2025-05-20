"use client";

import { clientDb } from "@/lib/firebase/client";
import { collection, query, where, orderBy } from "firebase/firestore";

/**
 * Get a Firestore query for all collections of the current user
 * @param userId The ID of the current user
 * @returns A Firestore query object that can be used with useCollection hook
 */
export const getUserCollectionsQuery = (userId: string) => {
  if (!userId) return null;

  const collectionsRef = collection(
    clientDb,
    `collections/${userId}/collections`
  );

  console.log("getUserCollectionsQuery collectionsRef::", collectionsRef);

  return query(collectionsRef, orderBy("updatedAt", "desc"));
};

/**
 * Get a Firestore query for collections of a specific product
 * @param userId The ID of the current user
 * @param productId The ID of the product
 * @returns A Firestore query object that can be used with useCollection hook
 */
export const getProductCollectionsQuery = (
  userId: string,
  productId: string
) => {
  if (!userId || !productId) return null;

  const collectionsRef = collection(
    clientDb,
    `collections/${userId}/collections`
  );

  console.log("getProductCollectionsQuery collectionsRef::", collectionsRef);

  return query(
    collectionsRef,
    // where("productId", "==", productId),
    orderBy("updatedAt", "desc")
  );
};
