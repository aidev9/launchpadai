# Creating a Standalone NPX-Compatible MCP Server for Vector Search

This guide outlines the steps to create a standalone NPX-compatible MCP server for vector search functionality, allowing users to include it in their client definitions using a command-line format.

## Implementation Steps

### 1. Create a New NPM Package

First, create a new directory for the MCP server package:

```bash
mkdir launchpadai-vector-mcp
cd launchpadai-vector-mcp
npm init -y
```

### 2. Install Required Dependencies

```bash
npm install @modelcontextprotocol/server dotenv openai pg compromise
```

### 3. Create the MCP Server Implementation

Create a `server.js` file with the following content:

```javascript
#!/usr/bin/env node

const { createServer } = require("@modelcontextprotocol/server");
const { Client } = require("pg");
const { OpenAI } = require("openai");
const nlp = require("compromise");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env file if present
dotenv.config();

// Helper functions for search
function extractKeywords(text) {
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
async function createEmbeddings(text) {
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
async function searchDocuments(query, collectionId, page = 1, pageSize = 10) {
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

  let client = null;

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

    // Lower the similarity threshold to 0.3 for better recall
    const similarityThreshold = 0.3;
    console.log(`[DEBUG] Using similarity threshold: ${similarityThreshold}`);

    // Properly format the embedding for the database query
    const embeddingFormatted = `[${embedding.join(",")}]`;

    // Count total results with vector similarity or keyword match
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

    const countParams = [
      collectionId,
      embeddingFormatted,
      ...keywords.map((k) => `%${k}%`),
    ];

    const countResult = await client.query(countQuery, countParams);
    const totalResults = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalResults / pageSize);

    console.log(
      `[DEBUG] Found ${totalResults} total results, ${totalPages} pages`
    );

    // Get paginated results
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

    return {
      success: true,
      results: searchResult.rows,
      page,
      totalPages,
      totalResults,
    };
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

// Create the MCP server
const server = createServer({
  name: "LaunchpadAI Vector Search",
  description:
    "MCP server for searching document collections using vector embeddings",
  version: "1.0.0",
  tools: [
    {
      name: "search_documents",
      description:
        "Search for documents in a collection using vector similarity",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
          collectionId: {
            type: "string",
            description: "The ID of the collection to search",
          },
          page: {
            type: "number",
            description: "The page number (starting from 1)",
            default: 1,
          },
          pageSize: {
            type: "number",
            description: "The number of results per page",
            default: 10,
          },
        },
        required: ["query", "collectionId"],
      },
      handler: async ({ query, collectionId, page = 1, pageSize = 10 }) => {
        return await searchDocuments(query, collectionId, page, pageSize);
      },
    },
  ],
  resources: [
    {
      name: "collections",
      description: "Access to document collections",
      uriPattern: "collection://{collectionId}",
      handler: async ({ collectionId }) => {
        // This would typically fetch collection metadata
        return {
          id: collectionId,
          name: `Collection ${collectionId}`,
          description: "Document collection",
        };
      },
    },
  ],
});

// Check for configuration file
const configPath = path.join(process.cwd(), ".launchpadai-mcp.json");
let config = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log("Loaded configuration from .launchpadai-mcp.json");
  } catch (error) {
    console.error("Error loading configuration:", error);
  }
}

// Start the server
server
  .listen({
    port: config.port || process.env.MCP_PORT || 0,
    stdio: process.argv.includes("--stdio"),
  })
  .then(({ port }) => {
    if (port) {
      console.log(
        `LaunchpadAI Vector Search MCP server running on port ${port}`
      );
    } else {
      console.log("LaunchpadAI Vector Search MCP server running in stdio mode");
    }
  });
```

### 4. Update package.json

Update your `package.json` to include the necessary configuration:

```json
{
  "name": "@launchpadai/vector-mcp",
  "version": "1.0.0",
  "description": "MCP server for LaunchpadAI vector search",
  "main": "server.js",
  "bin": {
    "launchpadai-vector-mcp": "./server.js"
  },
  "scripts": {
    "start": "node server.js"
  },
  "keywords": ["mcp", "vector", "search", "launchpadai"],
  "author": "LaunchpadAI",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/server": "^1.0.0",
    "compromise": "^14.10.0",
    "dotenv": "^16.3.1",
    "openai": "^4.0.0",
    "pg": "^8.11.3"
  }
}
```

### 5. Create a README.md

````markdown
# LaunchpadAI Vector MCP Server

An MCP server for searching document collections using vector embeddings.

## Installation

```bash
npm install -g @launchpadai/vector-mcp
```
````

## Usage

### Configuration

Create a `.launchpadai-mcp.json` file in your project directory:

```json
{
  "port": 3001,
  "neonDbConnectionString": "your-neon-db-connection-string",
  "openaiApiKey": "your-openai-api-key"
}
```

Alternatively, you can set the following environment variables:

- `NEON_DB_CONNECTION_STRING`: Your NeonDB connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `MCP_PORT`: The port to run the server on (optional)

### Running the server

```bash
launchpadai-vector-mcp
```

### Using with MCP clients

Add the following to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "launchpadai-vector": {
      "command": "npx",
      "args": ["-y", "@launchpadai/vector-mcp", "--stdio"],
      "env": {
        "NEON_DB_CONNECTION_STRING": "your-neon-db-connection-string",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

````

### 6. Publish to NPM

Once you've created and tested your package, you can publish it to NPM:

```bash
npm login
npm publish --access public
````

## Usage in Client Definitions

After publishing, users can include your MCP server in their client definitions like this:

```json
{
  "mcpServers": {
    "launchpadai-vector": {
      "command": "npx",
      "args": ["-y", "@launchpadai/vector-mcp", "--stdio"],
      "env": {
        "NEON_DB_CONNECTION_STRING": "your-neon-db-connection-string",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

## Key Benefits of This Approach

1. **Standardized Integration**: Follows the MCP protocol standard, making it compatible with various MCP clients.
2. **Easy Distribution**: Users can install and run your MCP server with a simple NPX command.
3. **Configuration Flexibility**: Supports both file-based and environment variable configuration.
4. **Stdio Mode**: Supports stdio mode for direct integration with MCP clients.
