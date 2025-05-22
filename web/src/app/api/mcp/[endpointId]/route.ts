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

    // Lower the similarity threshold to 0.3 for better recall
    const similarityThreshold = 0.3;
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
