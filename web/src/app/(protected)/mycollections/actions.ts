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
    const nlpTerms = [
      ...doc.nouns().out("array"),
      ...doc.verbs().out("array"),
      ...doc.match("#Adjective").out("array"),
    ];

    // Also split the text into individual words to catch important terms
    const simpleWords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word.length > 1);

    // Common stop words to filter out
    const stopWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "up",
      "about",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "can",
      "may",
      "might",
      "must",
      "shall",
      "this",
      "that",
      "these",
      "those",
      "a",
      "an",
      "as",
      "if",
      "each",
      "how",
      "what",
      "where",
      "when",
      "why",
      "who",
      "which",
    ]);

    // Combine and clean all terms
    const allTerms = [...nlpTerms, ...simpleWords];

    return [...new Set(allTerms)]
      .filter((term) => term.length > 1 && !stopWords.has(term.toLowerCase()))
      .map((term) => term.toLowerCase());
  } catch (error) {
    console.error("Error extracting keywords:", error);
    // Return the original text split into words if keyword extraction fails, with stop words filtered
    const stopWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));
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
  pageSize: number = 10,
  userId?: string
): Promise<SearchResponse> {
  console.log(
    `[DEBUG] Search initiated - Query: "${query}", Collection: ${collectionId}, Page: ${page}, PageSize: ${pageSize}`
  );

  if (!query || query.trim().length === 0) {
    console.error("[DEBUG] Empty query provided");
    return {
      success: false,
      error: "Search query cannot be empty",
    };
  }

  if (!collectionId || collectionId.trim().length === 0) {
    console.error("[DEBUG] Empty collection ID provided");
    return {
      success: false,
      error: "Collection ID cannot be empty",
    };
  }

  let client: Client | null = null;

  try {
    // Get current authenticated user ID or use provided userId
    let currentUserId: string;
    if (userId) {
      currentUserId = userId;
      console.log(`[DEBUG] Using provided user ID: ${currentUserId}`);
    } else {
      currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error("[DEBUG] User not authenticated");
        return {
          success: false,
          error: "User not authenticated",
        };
      }
      console.log(`[DEBUG] Authenticated user ID: ${currentUserId}`);
    }

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
      connectionString: process.env.NEON_DB_CONNECTION_STRING,
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

    // Very low similarity threshold for better recall
    const similarityThreshold = 0.1;
    console.log(`[DEBUG] Using similarity threshold: ${similarityThreshold}`);

    // Properly format the embedding for the database query
    const embeddingFormatted = `[${embedding.join(",")}]`;
    console.log(`[DEBUG] Embedding formatted as array`);

    // First, perform a simpler count query with fewer conditions for debugging
    const simpleCountQuery = `
      SELECT COUNT(*) as total
      FROM document_chunks
      WHERE collection_id = $1
        AND user_id = $2
    `;

    const simpleCountResult = await client.query(simpleCountQuery, [
      collectionId,
      currentUserId,
    ]);
    console.log(
      `[DEBUG] Documents in this collection for user: ${simpleCountResult.rows[0].total}`
    );

    // Let's also see a sample of what's in the database
    const sampleQuery = `
      SELECT document_title, filename, 
             LEFT(chunk_content, 100) as content_preview,
             COALESCE(chunk_keywords::text, '') as keywords_preview,
             COALESCE(document_keywords::text, '') as doc_keywords_preview
      FROM document_chunks 
      WHERE collection_id = $1 AND user_id = $2 
      LIMIT 3
    `;

    const sampleResult = await client.query(sampleQuery, [
      collectionId,
      currentUserId,
    ]);
    console.log(`[DEBUG] Sample documents:`, sampleResult.rows);

    // Build comprehensive search query with multiple field matching
    const searchConditions: string[] = [];
    let paramIndex = 4; // Start after collectionId, userId, and embedding

    // Add vector similarity condition (embedding is $3 since user_id is $2)
    searchConditions.push(
      `(1 - (c.embedding_vector <-> $3::vector)) > ${similarityThreshold}`
    );

    // Add keyword search across multiple fields if keywords exist
    if (keywords.length > 0) {
      const fieldConditions: string[] = [];

      keywords.forEach((keyword) => {
        const escapedKeyword = `%${keyword}%`;
        // Search in chunk content (highest weight)
        fieldConditions.push(`c.chunk_content ILIKE $${paramIndex}`);
        paramIndex++;

        // Search in document title (high weight)
        fieldConditions.push(`c.document_title ILIKE $${paramIndex}`);
        paramIndex++;

        // Search in filename (medium weight)
        fieldConditions.push(`c.filename ILIKE $${paramIndex}`);
        paramIndex++;

        // Search in chunk keywords if column exists (handle JSONB)
        fieldConditions.push(
          `COALESCE(c.chunk_keywords::text, '') ILIKE $${paramIndex}`
        );
        paramIndex++;

        // Search in document keywords if column exists (handle JSONB)
        fieldConditions.push(
          `COALESCE(c.document_keywords::text, '') ILIKE $${paramIndex}`
        );
        paramIndex++;
      });

      searchConditions.push(`(${fieldConditions.join(" OR ")})`);
    }

    // Build count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM document_chunks c
      WHERE c.collection_id = $1
        AND c.user_id = $2
        AND (${searchConditions.join(" OR ")})
    `;

    console.log(`[DEBUG] Count query: ${countQuery}`);

    // Build parameters array
    const countParams: any[] = [
      collectionId,
      currentUserId,
      embeddingFormatted,
    ];

    // Add keyword parameters for each field
    keywords.forEach((keyword) => {
      const escapedKeyword = `%${keyword}%`;
      countParams.push(escapedKeyword); // chunk_content
      countParams.push(escapedKeyword); // document_title
      countParams.push(escapedKeyword); // filename
      countParams.push(escapedKeyword); // chunk_keywords
      countParams.push(escapedKeyword); // document_keywords
    });

    try {
      const countResult = await client.query(countQuery, countParams);
      const totalResults = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(totalResults / pageSize);

      console.log(
        `[DEBUG] Found ${totalResults} total results, ${totalPages} pages`
      );

      // Build main search query with scoring - adjust paramIndex for user_id
      const adjustedParamIndex = paramIndex + 1;
      const searchQuery = `
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
          COALESCE(c.chunk_keywords::text, '') as chunk_keywords,
          COALESCE(c.document_keywords::text, '') as document_keywords,
          (1 - (c.embedding_vector <-> $3::vector)) AS vector_similarity,
          (
            -- Calculate keyword match score with field weighting
            CASE 
              WHEN ${
                keywords.length === 0
                  ? "FALSE"
                  : keywords
                      .map((_, i) => {
                        const baseIndex = 4 + i * 5;
                        return `(c.chunk_content ILIKE $${baseIndex} OR c.document_title ILIKE $${baseIndex + 1} OR c.filename ILIKE $${baseIndex + 2} OR COALESCE(c.chunk_keywords::text, '') ILIKE $${baseIndex + 3} OR COALESCE(c.document_keywords::text, '') ILIKE $${baseIndex + 4})`;
                      })
                      .join(" OR ")
              }
              THEN 1.0 
              ELSE 0.0 
            END
          ) AS keyword_score,
          (
            -- Combined relevance score (weighted combination)
            (1 - (c.embedding_vector <-> $3::vector)) * 0.7 +
            (
                              CASE 
                  WHEN ${
                    keywords.length === 0
                      ? "FALSE"
                      : keywords
                          .map((_, i) => {
                            const baseIndex = 4 + i * 5;
                            return `(c.chunk_content ILIKE $${baseIndex} OR c.document_title ILIKE $${baseIndex + 1} OR c.filename ILIKE $${baseIndex + 2} OR COALESCE(c.chunk_keywords::text, '') ILIKE $${baseIndex + 3} OR COALESCE(c.document_keywords::text, '') ILIKE $${baseIndex + 4})`;
                          })
                          .join(" OR ")
                  }
                  THEN 1.0 
                  ELSE 0.0 
                END
            ) * 0.3
          ) AS relevance_score
        FROM document_chunks c
        WHERE c.collection_id = $1
          AND c.user_id = $2
          AND (${searchConditions.join(" OR ")})
        ORDER BY relevance_score DESC, vector_similarity DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      console.log(`[DEBUG] Search query: ${searchQuery}`);

      const offset = (page - 1) * pageSize;
      const searchParams = [...countParams, pageSize, offset];

      const searchResult = await client.query(searchQuery, searchParams);
      console.log(`[DEBUG] Query returned ${searchResult.rows.length} results`);

      if (searchResult.rows.length > 0) {
        console.log(
          `[DEBUG] First result: document "${searchResult.rows[0].document_title}" with vector similarity ${searchResult.rows[0].vector_similarity} and relevance score ${searchResult.rows[0].relevance_score}`
        );
      }

      // Map results to maintain backward compatibility
      const mappedResults = searchResult.rows.map((row: any) => ({
        ...row,
        similarity: row.relevance_score || row.vector_similarity, // Use relevance score as similarity
      }));

      // If we got results, return them
      if (mappedResults.length > 0) {
        return {
          success: true,
          results: mappedResults,
          page,
          totalPages,
          totalResults,
        };
      }

      // If no results found, try a much more permissive search
      console.log("[DEBUG] No results found, trying more permissive search...");

      const permissiveQuery = `
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
          COALESCE(c.chunk_keywords::text, '') as chunk_keywords,
          COALESCE(c.document_keywords::text, '') as document_keywords,
          0.3 AS similarity
        FROM document_chunks c
        WHERE c.collection_id = $1
          AND c.user_id = $2
          ${
            keywords.length > 0
              ? `AND (
            ${keywords
              .map(
                (_, i) =>
                  `(c.chunk_content ILIKE $${3 + i} OR c.document_title ILIKE $${3 + i} OR c.filename ILIKE $${3 + i})`
              )
              .join(" OR ")}
          )`
              : ""
          }
        ORDER BY c.document_id, c.chunk_index
        LIMIT $${3 + keywords.length} OFFSET $${4 + keywords.length}
      `;

      const permissiveParams: any[] = [collectionId, currentUserId];
      keywords.forEach((keyword) => {
        permissiveParams.push(`%${keyword}%`);
      });
      permissiveParams.push(pageSize, (page - 1) * pageSize);

      console.log(`[DEBUG] Permissive query: ${permissiveQuery}`);
      console.log(
        `[DEBUG] Permissive params: ${JSON.stringify(permissiveParams)}`
      );

      const permissiveResult = await client.query(
        permissiveQuery,
        permissiveParams
      );
      console.log(
        `[DEBUG] Permissive search returned ${permissiveResult.rows.length} results`
      );

      return {
        success: true,
        results: permissiveResult.rows,
        page: 1,
        totalPages: Math.ceil(permissiveResult.rows.length / pageSize),
        totalResults: permissiveResult.rows.length,
      };
    } catch (error) {
      console.error("[DEBUG] Error executing search query:", error);

      // Enhanced fallback to keyword-only search across multiple fields
      console.log("[DEBUG] Falling back to enhanced keyword-only search");

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
          COALESCE(c.chunk_keywords::text, '') as chunk_keywords,
          COALESCE(c.document_keywords::text, '') as document_keywords,
          0.5 AS similarity
        FROM document_chunks c
        WHERE c.collection_id = $1
          AND c.user_id = $2
      `;

      const fallbackParams: any[] = [collectionId, currentUserId];
      let paramCounter = 3;

      if (keywords.length > 0) {
        const keywordConditions: string[] = [];
        keywords.forEach((keyword) => {
          const escapedKeyword = `%${keyword}%`;
          keywordConditions.push(`(
            c.chunk_content ILIKE $${paramCounter} OR 
            c.document_title ILIKE $${paramCounter} OR 
            c.filename ILIKE $${paramCounter} OR
            COALESCE(c.chunk_keywords::text, '') ILIKE $${paramCounter} OR
            COALESCE(c.document_keywords::text, '') ILIKE $${paramCounter}
          )`);
          fallbackParams.push(escapedKeyword);
          paramCounter++;
        });

        fallbackQuery += ` AND (${keywordConditions.join(" OR ")})`;
      }

      fallbackQuery += `
        ORDER BY c.document_id, c.chunk_index
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      console.log(`[DEBUG] Fallback query: ${fallbackQuery}`);

      const offset = (page - 1) * pageSize;
      fallbackParams.push(pageSize, offset);

      const fallbackResult = await client.query(fallbackQuery, fallbackParams);
      console.log(
        `[DEBUG] Fallback query returned ${fallbackResult.rows.length} results`
      );

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
