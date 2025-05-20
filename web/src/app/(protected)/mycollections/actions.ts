"use server";

import { revalidatePath } from "next/cache";
import {
  Collection,
  CollectionInput,
  CollectionStatus,
  Document,
  DocumentInput,
  DocumentStatus,
} from "@/lib/firebase/schema";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  updateCollectionStatus,
  deleteMultipleCollections,
} from "@/lib/firebase/collections";
import {
  createDocument,
  updateDocument,
  deleteDocument,
  updateDocumentStatus,
  deleteMultipleDocuments,
  uploadDocumentFile,
} from "@/lib/firebase/documents";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { Client } from "pg";
import { OpenAI } from "openai";
import nlp from "compromise";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Collection actions
export async function createCollectionAction(data: CollectionInput) {
  try {
    const result = await createCollection(data);

    if (result.success) {
      revalidatePath("/mycollections");
      return {
        success: true,
        id: result.id,
        collection: result.collection,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

export async function updateCollectionAction(
  id: string,
  data: Partial<CollectionInput>
) {
  try {
    const result = await updateCollection(id, data);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error updating collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update collection",
    };
  }
}

export async function updateCollectionStatusAction(
  id: string,
  status: CollectionStatus
) {
  try {
    const result = await updateCollectionStatus(id, status);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error updating collection status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update collection status",
    };
  }
}

export async function deleteCollectionAction(id: string) {
  try {
    const result = await deleteCollection(id);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error deleting collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete collection",
    };
  }
}

export async function deleteMultipleCollectionsAction(ids: string[]) {
  try {
    const result = await deleteMultipleCollections(ids);

    if (result.success) {
      revalidatePath("/mycollections");
      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } else {
      return {
        success: false,
        error: result.error,
        deletedCount: 0,
      };
    }
  } catch (error) {
    console.error("Error deleting multiple collections:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete collections",
      deletedCount: 0,
    };
  }
}

// Document actions
export async function createDocumentAction(data: DocumentInput, file?: File) {
  try {
    // First create the document with status "uploading"
    const initialData = {
      ...data,
      status: "uploading" as DocumentStatus,
    };

    const result = await createDocument(initialData);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const documentId = result.id!;
    const document = result.document!;

    // If there's a file, upload it
    if (file) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload the file
      const uploadResult = await uploadDocumentFile(
        buffer,
        data.collectionId,
        documentId,
        file.name,
        file.type
      );

      if (!uploadResult.success) {
        // Update document status to indicate error
        await updateDocumentStatus(documentId, "uploaded");
        return {
          success: false,
          error: uploadResult.error || "Failed to upload file",
          document,
        };
      }

      // Update the document with the file URL and path
      const updateResult = await updateDocument(documentId, {
        url: uploadResult.url || "",
        filePath: uploadResult.filePath || "",
        status: "uploaded" as DocumentStatus,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
          document,
        };
      }

      // Update the document object with the new data
      document.url = uploadResult.url || "";
      document.filePath = uploadResult.filePath || "";
      document.status = "uploaded";
      document.updatedAt = getCurrentUnixTimestamp();
    } else {
      // If no file, just mark as uploaded
      await updateDocumentStatus(documentId, "uploaded");
      document.status = "uploaded";
      document.updatedAt = getCurrentUnixTimestamp();
    }

    revalidatePath("/mycollections");

    return {
      success: true,
      id: documentId,
      document,
    };
  } catch (error) {
    console.error("Error creating document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create document",
    };
  }
}

export async function updateDocumentAction(
  id: string,
  data: Partial<DocumentInput>,
  file?: File
) {
  try {
    // If there's a file, upload it
    if (file) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Update document status to uploading
      await updateDocumentStatus(id, "uploading");

      // Upload the file
      const uploadResult = await uploadDocumentFile(
        buffer,
        data.collectionId!,
        id,
        file.name,
        file.type
      );

      if (!uploadResult.success) {
        // Update document status to indicate error
        await updateDocumentStatus(id, "uploaded");
        return {
          success: false,
          error: uploadResult.error || "Failed to upload file",
        };
      }

      // Update the document with the file URL and path
      data.url = uploadResult.url || "";
      data.filePath = uploadResult.filePath || "";
      data.status = "uploaded";
    }

    // Update the document
    const result = await updateDocument(id, data);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update document",
    };
  }
}

export async function updateDocumentStatusAction(
  id: string,
  status: DocumentStatus
) {
  try {
    const result = await updateDocumentStatus(id, status);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error updating document status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update document status",
    };
  }
}

export async function deleteDocumentAction(id: string) {
  try {
    const result = await deleteDocument(id);

    if (result.success) {
      revalidatePath("/mycollections");
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

export async function deleteMultipleDocumentsAction(ids: string[]) {
  try {
    const result = await deleteMultipleDocuments(ids);

    if (result.success) {
      revalidatePath("/mycollections");
      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } else {
      return {
        success: false,
        error: result.error,
        deletedCount: 0,
      };
    }
  } catch (error) {
    console.error("Error deleting multiple documents:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete documents",
      deletedCount: 0,
    };
  }
}

// Search functionality
export interface DocumentChunkSearchResult {
  id: number;
  document_id: string;
  user_id: string;
  product_id: string;
  collection_id: string;
  chunk_index: number;
  total_chunks: number;
  chunk_content: string;
  filename: string;
  file_url: string;
  document_title: string;
  collection_name: string;
  similarity: number;
}

export interface SearchResponse {
  success: boolean;
  results?: DocumentChunkSearchResult[];
  error?: string;
  page?: number;
  totalPages?: number;
  totalResults?: number;
}

// Extract keywords from search query using compromise
function extractKeywords(text: string): string[] {
  try {
    const doc = nlp(text);
    // Extract nouns, proper nouns, and verbs which are likely to be important keywords
    const terms = [
      ...doc.nouns().out("array"),
      ...doc.verbs().out("array"),
      ...doc.match("#Adjective").out("array"),
    ];

    // Remove duplicates and common words
    return [...new Set(terms)]
      .filter((term) => term.length > 2) // Filter out very short terms
      .map((term) => term.toLowerCase());
  } catch (error) {
    console.error("Error extracting keywords:", error);
    // Return the original text split into words if keyword extraction fails
    return text.split(/\s+/).filter((word) => word.length > 2);
  }
}

// Create embeddings using OpenAI API
async function createEmbeddings(text: string): Promise<number[]> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-3-small",
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    } else {
      throw new Error("Invalid response from OpenAI embedding API");
    }
  } catch (error) {
    console.error("Error creating embeddings:", error);
    throw error;
  }
}

// Search document chunks in NeonDB
export async function searchDocumentChunks(
  query: string,
  collectionId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResponse> {
  console.log(
    `[DEBUG] Search initiated - Query: "${query}", Collection: ${collectionId}, Page: ${page}, PageSize: ${pageSize}`
  );

  // Verify that necessary environment variables are set
  const neonDbConnectionString = process.env.NEON_DB_CONNECTION_STRING;
  if (!neonDbConnectionString) {
    console.error("[DEBUG] Missing NeonDB connection string");
    return {
      success: false,
      error: "Database connection string not configured",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("[DEBUG] Missing OpenAI API key");
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  let client: Client | null = null;

  try {
    // Get current authenticated user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error("[DEBUG] User not authenticated");
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    console.log(`[DEBUG] Authenticated user ID: ${userId}`);

    // Extract keywords from the query
    const keywords = extractKeywords(query);
    console.log(`[DEBUG] Extracted keywords: ${JSON.stringify(keywords)}`);

    // Generate embeddings for the query
    console.log("[DEBUG] Generating embeddings...");
    const embedding = await createEmbeddings(query);
    console.log(
      `[DEBUG] Generated embedding with ${embedding.length} dimensions`
    );

    // Connect to NeonDB
    console.log("[DEBUG] Connecting to NeonDB...");
    client = new Client({
      connectionString: neonDbConnectionString,
    });
    await client.connect();
    console.log("[DEBUG] Connected to NeonDB");

    // Check if table exists and has data
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_chunks'
      ) as table_exists;
    `;
    const tableResult = await client.query(checkTableQuery);
    console.log(`[DEBUG] Table exists: ${tableResult.rows[0].table_exists}`);

    if (tableResult.rows[0].table_exists) {
      const countDocumentsQuery = `SELECT COUNT(*) FROM document_chunks;`;
      const docCountResult = await client.query(countDocumentsQuery);
      console.log(
        `[DEBUG] Total documents in chunks table: ${docCountResult.rows[0].count}`
      );
    }

    // Lower the similarity threshold to 0.3 for better recall
    const similarityThreshold = 0.3;
    console.log(`[DEBUG] Using similarity threshold: ${similarityThreshold}`);

    // Properly format the embedding for the database query
    // PostgreSQL's vector type expects a specific format - try with array rather than JSON string
    const embeddingFormatted = `[${embedding.join(",")}]`;
    console.log(`[DEBUG] Embedding formatted as array`);

    // First, perform a simpler count query with fewer conditions for debugging
    const simpleCountQuery = `
      SELECT COUNT(*) as total
      FROM document_chunks
      WHERE collection_id = $1
    `;

    const simpleCountResult = await client.query(simpleCountQuery, [
      collectionId,
    ]);
    console.log(
      `[DEBUG] Documents in this collection: ${simpleCountResult.rows[0].total}`
    );

    // Then, count total results with vector similarity or keyword match
    let countQuery = `
      SELECT COUNT(*) as total
      FROM document_chunks c
      WHERE c.collection_id = $1
        AND (
          1 - (c.embedding_vector <-> $2::vector) > ${similarityThreshold}
    `;

    if (keywords.length > 0) {
      countQuery += ` OR (`;
      keywords.forEach((_, index) => {
        if (index > 0) countQuery += " OR ";
        countQuery += `c.chunk_content ILIKE $${index + 3}`;
      });
      countQuery += `))`;
    } else {
      countQuery += `)`;
    }

    console.log(`[DEBUG] Count query: ${countQuery}`);

    const countParams = [
      collectionId,
      embeddingFormatted,
      ...keywords.map((k) => `%${k}%`),
    ];
    console.log(
      `[DEBUG] Count params: [Collection: ${collectionId}, Embedding: [vector], Keywords: ${keywords.map((k) => `%${k}%`).join(", ")}]`
    );

    try {
      const countResult = await client.query(countQuery, countParams);
      const totalResults = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(totalResults / pageSize);

      console.log(
        `[DEBUG] Found ${totalResults} total results, ${totalPages} pages`
      );

      // Then, get paginated results with less restrictive conditions
      let searchQuery = `
        SELECT 
          c.id,
          c.document_id,
          c.user_id,
          c.product_id,
          c.collection_id,
          c.chunk_index,
          c.total_chunks,
          c.chunk_content,
          c.filename,
          c.file_url,
          c.document_title,
          c.collection_name,
          1 - (c.embedding_vector <-> $2::vector) AS similarity
        FROM document_chunks c
        WHERE c.collection_id = $1
          AND (
            1 - (c.embedding_vector <-> $2::vector) > ${similarityThreshold}
      `;

      if (keywords.length > 0) {
        searchQuery += ` OR (`;
        keywords.forEach((_, index) => {
          if (index > 0) searchQuery += " OR ";
          searchQuery += `c.chunk_content ILIKE $${index + 3}`;
        });
        searchQuery += `))`;
      } else {
        searchQuery += `)`;
      }

      searchQuery += `
        ORDER BY similarity DESC
        LIMIT $${keywords.length + 3} OFFSET $${keywords.length + 4}
      `;

      console.log(`[DEBUG] Search query: ${searchQuery}`);

      const offset = (page - 1) * pageSize;
      const searchParams = [
        collectionId,
        embeddingFormatted,
        ...keywords.map((k) => `%${k}%`),
        pageSize,
        offset,
      ];
      console.log(
        `[DEBUG] Search params: [Collection: ${collectionId}, Embedding: [vector], Keywords: ${keywords.map((k) => `%${k}%`).join(", ")}, Limit: ${pageSize}, Offset: ${offset}]`
      );

      const searchResult = await client.query(searchQuery, searchParams);
      console.log(`[DEBUG] Query returned ${searchResult.rows.length} results`);

      if (searchResult.rows.length > 0) {
        console.log(
          `[DEBUG] First result: document "${searchResult.rows[0].document_title}" with similarity ${searchResult.rows[0].similarity}`
        );
      }

      return {
        success: true,
        results: searchResult.rows,
        page,
        totalPages,
        totalResults,
      };
    } catch (error) {
      console.error("[DEBUG] Error executing search query:", error);

      // If vector search fails, fall back to keyword-only search
      console.log("[DEBUG] Falling back to keyword-only search");

      let fallbackQuery = `
        SELECT 
          c.id,
          c.document_id,
          c.user_id,
          c.product_id,
          c.collection_id,
          c.chunk_index,
          c.total_chunks,
          c.chunk_content,
          c.filename,
          c.file_url,
          c.document_title,
          c.collection_name,
          0.7 AS similarity
        FROM document_chunks c
        WHERE c.collection_id = $1
      `;

      if (keywords.length > 0) {
        fallbackQuery += ` AND (`;
        keywords.forEach((_, index) => {
          if (index > 0) fallbackQuery += " OR ";
          fallbackQuery += `c.chunk_content ILIKE $${index + 2}`;
        });
        fallbackQuery += `)`;
      }

      fallbackQuery += `
        ORDER BY c.document_id, c.chunk_index
        LIMIT $${keywords.length + 2} OFFSET $${keywords.length + 3}
      `;

      console.log(`[DEBUG] Fallback query: ${fallbackQuery}`);

      const offset = (page - 1) * pageSize;
      const fallbackParams = [
        collectionId,
        ...keywords.map((k) => `%${k}%`),
        pageSize,
        offset,
      ];

      const fallbackResult = await client.query(fallbackQuery, fallbackParams);
      console.log(
        `[DEBUG] Fallback query returned ${fallbackResult.rows.length} results`
      );

      // For fallback, we'll just assume there's only one page
      return {
        success: true,
        results: fallbackResult.rows,
        page: 1,
        totalPages: 1,
        totalResults: fallbackResult.rows.length,
      };
    }
  } catch (error) {
    console.error("[DEBUG] Error searching document chunks:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  } finally {
    if (client) {
      await client.end();
      console.log("[DEBUG] Database connection closed");
    }
  }
}
