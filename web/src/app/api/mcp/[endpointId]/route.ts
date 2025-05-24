import { NextRequest, NextResponse } from "next/server";
import { getMcpEndpointConfigServer } from "@/lib/firebase/mcp-endpoints";
import { rateLimit } from "@/lib/rate-limit";
import { verifyAuth } from "@/lib/mcp-auth";
import { Client } from "pg";
import { OpenAI } from "openai";
import nlp from "compromise";

// Mark this file as a server component
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper functions for search
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
      .filter((word) => word.length > 2);

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
      .filter((term) => term.length > 2 && !stopWords.has(term.toLowerCase()))
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
      .filter((word) => word.length > 2 && !stopWords.has(word));
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

// Search document chunks in NeonDB without requiring authentication
async function searchDocumentsForMcp(
  query: string,
  collectionId: string,
  page: number = 1,
  pageSize: number = 10
) {
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
    `;

    const simpleCountResult = await client.query(simpleCountQuery, [
      collectionId,
    ]);
    console.log(
      `[DEBUG] Documents in this collection: ${simpleCountResult.rows[0].total}`
    );

    // Build comprehensive search query with multiple field matching
    const searchConditions: string[] = [];
    let paramIndex = 3; // Start after collectionId and embedding

    // Add vector similarity condition
    searchConditions.push(
      `(1 - (c.embedding_vector <-> $2::vector)) > ${similarityThreshold}`
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
        AND (${searchConditions.join(" OR ")})
    `;

    console.log(`[DEBUG] Count query: ${countQuery}`);

    // Build parameters array
    const countParams = [collectionId, embeddingFormatted];

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

      // Build main search query with scoring
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
          (1 - (c.embedding_vector <-> $2::vector)) AS vector_similarity,
          (
            -- Calculate keyword match score with field weighting
            CASE 
              WHEN ${
                keywords.length === 0
                  ? "FALSE"
                  : keywords
                      .map((_, i) => {
                        const baseIndex = 3 + i * 5;
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
            (1 - (c.embedding_vector <-> $2::vector)) * 0.7 +
            (
              CASE 
                WHEN ${
                  keywords.length === 0
                    ? "FALSE"
                    : keywords
                        .map((_, i) => {
                          const baseIndex = 3 + i * 5;
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
      const mappedResults = searchResult.rows.map((row) => ({
        ...row,
        similarity: row.relevance_score || row.vector_similarity, // Use relevance score as similarity
      }));

      return {
        success: true,
        results: mappedResults,
        page,
        totalPages,
        totalResults,
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
      `;

      const fallbackParams: any[] = [collectionId];
      let paramCounter = 2;

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ endpointId: string }> }
) {
  const params = await context.params;
  const endpointId = params.endpointId;

  if (!endpointId) {
    return NextResponse.json({ error: "Missing endpoint ID" }, { status: 400 });
  }

  try {
    console.log(`[MCP] Request received for endpoint: ${endpointId}`);

    // Get endpoint configuration
    const result = await getMcpEndpointConfigServer(endpointId);
    if (!result.success || !result.endpointConfig) {
      console.error(`[MCP] Endpoint not found: ${endpointId}`);
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    const config = result.endpointConfig;
    console.log(`[MCP] Found endpoint config for: ${config.name}`);

    // Check if endpoint is enabled
    if (!config.isEnabled) {
      console.error(`[MCP] Endpoint is disabled: ${endpointId}`);
      return NextResponse.json(
        { error: "Endpoint is disabled" },
        { status: 403 }
      );
    }

    // Verify authentication
    const authResult = verifyAuth(req, config);
    if (!authResult.success) {
      console.error(`[MCP] Authentication failed: ${authResult.error}`);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimit(req, config);
    if (!rateLimitResult.success) {
      console.error(`[MCP] Rate limit exceeded for endpoint: ${endpointId}`);
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Process MCP request
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error(`[MCP] Invalid JSON in request body: ${error}`);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate request parameters
    const { query, limit = 10 } = requestBody;

    if (!query || typeof query !== "string") {
      console.error(`[MCP] Missing or invalid query parameter`);
      return NextResponse.json(
        { error: "Missing or invalid query parameter" },
        { status: 400 }
      );
    }

    if (typeof limit !== "number" || limit < 1 || limit > 100) {
      console.error(`[MCP] Invalid limit parameter: ${limit}`);
      return NextResponse.json(
        {
          error: "Invalid limit parameter (must be a number between 1 and 100)",
        },
        { status: 400 }
      );
    }

    console.log(`[MCP] Searching for: "${query}" with limit: ${limit}`);

    // Use our custom search function that doesn't require authentication
    const searchResults = await searchDocumentsForMcp(
      query,
      config.collectionId,
      1, // page
      limit // pageSize
    );

    if (!searchResults.success) {
      console.error(`[MCP] Search failed: ${searchResults.error}`);
      return NextResponse.json(
        { error: searchResults.error || "Search failed" },
        { status: 500 }
      );
    }

    // Return search results
    console.log(
      `[MCP] Search returned ${searchResults.results?.length || 0} results`
    );
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("[MCP] Error processing request:", error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}
