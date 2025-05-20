"use client";

import { clientDb } from "@/lib/firebase/client";
import { Document } from "@/lib/firebase/schema";
import { collection, query, where, orderBy } from "firebase/firestore";

/**
 * Get a Firestore query for all documents in a collection
 * @param userId The ID of the current user
 * @param collectionId The ID of the collection to get documents from
 * @returns A Firestore query object that can be used with useCollection hook
 */
export const getCollectionDocumentsQuery = (
  userId: string,
  collectionId: string
) => {
  if (!userId || !collectionId) return null;

  return query(
    collection(clientDb, `documents/${userId}/documents`),
    where("collectionId", "==", collectionId),
    orderBy("updatedAt", "desc")
  );
};

/**
 * Get a Firestore query for a specific document
 * @param userId The ID of the current user
 * @param documentId The ID of the document to get
 * @returns A Firestore query object that can be used with useDocument hook
 */
export const getDocumentQuery = (userId: string, documentId: string) => {
  if (!userId || !documentId) return null;

  return query(
    collection(clientDb, `documents/${userId}/documents`),
    where("id", "==", documentId)
  );
};
