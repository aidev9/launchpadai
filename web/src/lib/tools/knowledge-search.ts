import { tool } from "ai";
import { z } from "zod";
import { searchDocumentChunks } from "@/app/(protected)/mycollections/actions";
import { Agent } from "@/lib/firebase/schema";

export const createKnowledgeSearchTool = (agent: Agent) =>
  tool({
    description:
      "Search through the agent's knowledge base collections for relevant information. Use this tool when users ask questions that might be answered by information in your knowledge base. Always search your knowledge base before providing answers to ensure accuracy.",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "The search query to find relevant documents. Use specific keywords and phrases from the user's question."
        ),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return (1-10)"),
    }),
    execute: async ({ query, limit }) => {
      try {
        console.log(
          `[KnowledgeSearch] Searching for: "${query}" with limit: ${limit}`
        );

        if (!agent?.collections || agent.collections.length === 0) {
          return {
            success: false,
            error: "No collections available for this agent",
            results: [],
            guidance:
              "This agent does not have access to any knowledge collections. Please configure collections in the agent settings to enable knowledge search capabilities.",
          };
        }

        // Search across all collections assigned to the agent
        const allResults = [];

        for (const collectionId of agent.collections) {
          console.log(
            `[KnowledgeSearch] Searching collection: ${collectionId}`
          );

          const searchResponse = await searchDocumentChunks(
            query,
            collectionId,
            1, // page
            Math.min(limit, 10), // pageSize, capped at 10
            agent.userId // Pass the agent's userId for authentication
          );

          if (searchResponse.success && searchResponse.results) {
            // Add collection context to results
            const resultsWithCollection = searchResponse.results.map(
              (result) => ({
                ...result,
                source_collection: collectionId,
              })
            );

            allResults.push(...resultsWithCollection);
          } else {
            console.warn(
              `[KnowledgeSearch] Failed to search collection ${collectionId}:`,
              searchResponse.error
            );
          }
        }

        // Sort all results by relevance score and limit
        const sortedResults = allResults
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, limit);

        console.log(
          `[KnowledgeSearch] Found ${sortedResults.length} total results across ${agent.collections.length} collections`
        );

        if (sortedResults.length === 0) {
          return {
            success: true,
            message:
              "No relevant documents found in the knowledge base for this query.",
            results: [],
            query,
            guidance:
              "Try rephrasing your query with different keywords or ask about topics that might be covered in the available knowledge collections.",
          };
        }

        // Format results for better LLM synthesis
        const formattedResults = sortedResults.map((result, index) => {
          const relevancePercentage = Math.round(
            (result.similarity || 0) * 100
          );
          const documentTitle =
            result.document_title || result.filename || "Untitled Document";

          return {
            rank: index + 1,
            title: documentTitle,
            content: result.chunk_content,
            relevance_score: result.similarity,
            relevance_percentage: relevancePercentage,
            source_collection: result.source_collection,
            document_id: result.document_id,
            chunk_index: result.chunk_index,
            file_url: result.file_url,
            // Enhanced context for LLM
            source_context: `Document: "${documentTitle}" (Chunk ${result.chunk_index + 1}, Relevance: ${relevancePercentage}%)`,
            citation: `[${documentTitle}]${result.file_url ? `(${result.file_url})` : ""}`,
          };
        });

        // Create synthesis guidance for the LLM
        const synthesisGuidance = `
KNOWLEDGE SEARCH RESULTS FOUND (${sortedResults.length} results for query: "${query}")

IMPORTANT INSTRUCTIONS FOR USING THESE RESULTS:
1. These results come from the agent's knowledge base and should be considered authoritative for this domain
2. Always cite sources when using information from these results
3. Synthesize information from multiple results when relevant
4. If results contradict each other, acknowledge the discrepancy
5. Use the relevance scores to prioritize information (higher scores = more relevant)

RESULTS SUMMARY:
- Total results: ${sortedResults.length}
- Collections searched: ${agent.collections.length}
- Highest relevance: ${Math.round((sortedResults[0]?.similarity || 0) * 100)}%
- Query: "${query}"

Please use this information to provide a comprehensive, well-sourced answer to the user's question.
        `.trim();

        return {
          success: true,
          query,
          total_results: sortedResults.length,
          collections_searched: agent.collections.length,
          results: formattedResults,
          synthesis_guidance: synthesisGuidance,
          message: `Found ${sortedResults.length} relevant documents in the knowledge base. Use this information to provide a comprehensive answer with proper source citations.`,
        };
      } catch (error) {
        console.error(
          "[KnowledgeSearch] Error searching knowledge base:",
          error
        );
        return {
          success: false,
          error: "Failed to search knowledge base",
          query,
          results: [],
          guidance:
            "There was a technical error searching the knowledge base. Please try again or contact support if the issue persists.",
        };
      }
    },
  });
