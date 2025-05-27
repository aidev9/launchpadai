import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createToolsFromConfig, getUserToolConfigurations } from "@/lib/tools";
import { serverAgentsService } from "@/lib/firebase/server/agents";

// MCP Protocol types
interface McpRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Mark this file as server component
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[MCP Agent] Request for agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Get the agent using the public method (no user authentication required)
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    // Verify API key matches
    if (agent.configuration.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Parse MCP request
    const mcpRequest: McpRequest = await req.json();

    console.log(`[MCP Agent] Method: ${mcpRequest.method}`);

    // Handle different MCP methods
    switch (mcpRequest.method) {
      case "initialize":
        return NextResponse.json(
          createMcpResponse(mcpRequest.id, {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: agent.name,
              version: "1.0.0",
            },
          })
        );

      case "tools/list":
        const tools: McpTool[] = [
          {
            name: "chat",
            description: `Chat with ${agent.name}`,
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The message to send to the agent",
                },
                context: {
                  type: "object",
                  description: "Optional context for the conversation",
                  properties: {
                    conversation_id: { type: "string" },
                    user_id: { type: "string" },
                  },
                },
                stream: {
                  type: "boolean",
                  description:
                    "Whether to stream the response (default: false)",
                  default: false,
                },
              },
              required: ["message"],
            },
          },
          {
            name: "chat_stream",
            description: `Chat with ${agent.name} (streaming mode)`,
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The message to send to the agent",
                },
                context: {
                  type: "object",
                  description: "Optional context for the conversation",
                  properties: {
                    conversation_id: { type: "string" },
                    user_id: { type: "string" },
                  },
                },
              },
              required: ["message"],
            },
          },
          {
            name: "get_agent_info",
            description: `Get information about ${agent.name}`,
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ];

        // Add knowledge search tool if agent has collections
        if (agent.collections && agent.collections.length > 0) {
          tools.push({
            name: "search_knowledge",
            description: `Search ${agent.name}'s knowledge base`,
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: 5,
                },
              },
              required: ["query"],
            },
          });
        }

        return NextResponse.json(createMcpResponse(mcpRequest.id, { tools }));

      case "tools/call":
        const { name: toolName, arguments: toolArgs } = mcpRequest.params;

        switch (toolName) {
          case "chat":
            // Handle chat tool call (non-streaming by default, unless stream=true)
            const shouldStream = toolArgs.stream === true;

            if (shouldStream) {
              // Return streaming response
              const streamResponse = await handleChatToolStreaming(
                agent,
                toolArgs
              );
              return streamResponse;
            } else {
              // Return single response
              const chatResponse = await handleChatTool(agent, toolArgs);
              return NextResponse.json(
                createMcpResponse(mcpRequest.id, {
                  content: [
                    {
                      type: "text",
                      text: chatResponse,
                    },
                  ],
                })
              );
            }

          case "chat_stream":
            // Handle streaming chat tool call
            const streamResponse = await handleChatToolStreaming(
              agent,
              toolArgs
            );
            return streamResponse;

          case "get_agent_info":
            // Handle agent info tool call
            return NextResponse.json(
              createMcpResponse(mcpRequest.id, {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        id: agent.id,
                        name: agent.name,
                        description: agent.description,
                        capabilities: [
                          "chat",
                          "chat_stream",
                          "reasoning",
                          ...(agent.collections && agent.collections.length > 0
                            ? ["knowledge_search"]
                            : []),
                        ],
                        collections: agent.collections?.length || 0,
                        tools: agent.tools?.length || 0,
                        streaming_support: true,
                      },
                      null,
                      2
                    ),
                  },
                ],
              })
            );

          case "search_knowledge":
            // Handle knowledge search tool call
            if (!agent.collections || agent.collections.length === 0) {
              return NextResponse.json(
                createMcpError(
                  mcpRequest.id,
                  -32601,
                  "Knowledge search not available for this agent"
                )
              );
            }

            const searchResponse = await handleKnowledgeSearch(agent, toolArgs);
            return NextResponse.json(
              createMcpResponse(mcpRequest.id, {
                content: [
                  {
                    type: "text",
                    text: searchResponse,
                  },
                ],
              })
            );

          default:
            return NextResponse.json(
              createMcpError(mcpRequest.id, -32601, `Unknown tool: ${toolName}`)
            );
        }

      default:
        return NextResponse.json(
          createMcpError(
            mcpRequest.id,
            -32601,
            `Unknown method: ${mcpRequest.method}`
          )
        );
    }
  } catch (error) {
    console.error("[MCP Agent] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function createMcpResponse(id: string | number, result: any): McpResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function createMcpError(
  id: string | number,
  code: number,
  message: string,
  data?: any
): McpResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

async function handleChatTool(agent: any, args: any): Promise<string> {
  try {
    // Get user's tool configurations and create tools
    let tools = {};
    let enabledToolConfigs: any[] = [];

    if (agent.userId && agent.userId.trim() !== "") {
      try {
        console.log(
          `[MCP Agent Chat] Loading tool configurations for user ${agent.userId}`
        );
        console.log(`[MCP Agent Chat] Agent tools array:`, agent.tools);

        const toolConfigs = await getUserToolConfigurations(agent.userId);
        console.log(
          `[MCP Agent Chat] Found ${toolConfigs.length} tool configurations:`,
          toolConfigs.map((c) => ({
            toolId: c.toolId,
            isEnabled: c.isEnabled,
            hasApiKey: !!c.apiKey,
          }))
        );

        // Log detailed filtering process
        const filteredConfigs = toolConfigs.filter((config: any) => {
          const isEnabled = config.isEnabled;
          const isInAgentTools = agent.tools?.includes(config.toolId);

          console.log(
            `[MCP Agent Chat] Tool ${config.toolId}: enabled=${isEnabled}, inAgentTools=${isInAgentTools}, hasApiKey=${!!config.apiKey}`
          );

          return isEnabled && isInAgentTools;
        });

        enabledToolConfigs = filteredConfigs.map((config: any) => ({
          toolId: config.toolId,
          isEnabled: config.isEnabled,
          apiKey: config.apiKey,
          config: config.config,
        }));

        tools = createToolsFromConfig(enabledToolConfigs);
        console.log(
          `[MCP Agent Chat] Created ${Object.keys(tools).length} tools:`,
          Object.keys(tools)
        );
      } catch (error) {
        console.warn(
          `[MCP Agent Chat] Failed to load tool configurations for user ${agent.userId}:`,
          error
        );
        tools = {};
        enabledToolConfigs = [];
      }
    }

    // Add knowledge search tool if agent has collections
    let allTools = tools;
    if (agent.collections && agent.collections.length > 0) {
      const { createKnowledgeSearchTool } = await import(
        "@/lib/tools/knowledge-search"
      );
      const knowledgeSearchTool = createKnowledgeSearchTool(agent);
      allTools = {
        ...tools,
        search_knowledge: knowledgeSearchTool,
      };
      console.log(
        `[MCP Agent Chat] Added knowledge search tool for ${agent.collections.length} collections`
      );
    }

    // Build the system prompt with consistent tool instructions
    const baseSystemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Add knowledge base instructions if agent has collections
    const knowledgeInstructions =
      agent.collections && agent.collections.length > 0
        ? `\n\nKNOWLEDGE BASE ACCESS:
You have access to a knowledge base containing ${agent.collections.length} collection(s) of documents. This knowledge base contains authoritative information for your domain.

WHEN TO USE KNOWLEDGE SEARCH:
- When users ask questions that might be answered by information in your knowledge base
- For domain-specific information that could be in your collections
- When you need specific facts, data, or detailed information from your knowledge base
- When users ask about topics that could be covered in your collections

COMBINING KNOWLEDGE SEARCH WITH OTHER TOOLS:
- Use knowledge search for domain-specific information from your collections
- Use web search tools (like Tavily) for current events, recent information, or topics outside your knowledge base
- When appropriate, use BOTH knowledge search AND web search to provide comprehensive answers
- Knowledge base information should be considered authoritative for your domain
- Web search provides current and broader context

HOW TO USE KNOWLEDGE SEARCH RESULTS:
1. Search your knowledge base when the query relates to your domain expertise
2. Use the 'search_knowledge' tool with specific keywords from the user's question
3. Prioritize information from higher relevance scores (shown as percentages)
4. Synthesize information from multiple results when relevant
5. If results contradict each other, acknowledge the discrepancy and explain
6. Always cite your sources using the provided citation format

CITATION REQUIREMENTS:
- Always cite sources when using information from knowledge search results
- Use the citation format provided in the search results
- Reference document titles and relevance scores when helpful
- If multiple sources support the same point, cite all relevant sources
- Format citations clearly at the end of your response in a "Sources:" section

SYNTHESIS GUIDELINES:
- Combine information from knowledge base AND web search when both are relevant
- Explain how different pieces of information relate to each other
- If information is incomplete, acknowledge what's missing and consider using additional tools
- Use your general knowledge to provide context, but clearly distinguish between different information sources
- Clearly indicate which information comes from your knowledge base vs. web search vs. general knowledge

Remember: Use the most appropriate tools for each query. Your knowledge base is authoritative for your domain, but web search tools provide current and broader information.`
        : "";

    // Add tool usage instructions if tools are available
    const toolInstructions =
      Object.keys(allTools).length > 0
        ? `\n\nTOOL USAGE:
You have access to the following tools: ${Object.keys(allTools).join(", ")}. 

GENERAL TOOL GUIDELINES:
- Use tools when they would be helpful to answer the user's questions or complete their requests
- Consider using MULTIPLE tools when they provide complementary information
- For comprehensive answers, combine results from different tools (e.g., knowledge search + web search)
- Always incorporate the results from tool calls into your response
- Provide accurate and up-to-date information based on tool results
- If a tool fails or returns an error, acknowledge this and try alternative tools when available

TOOL SELECTION STRATEGY:
- Use knowledge search for domain-specific information from your collections
- Use web search (Tavily, DuckDuckGo) for current events, recent information, or broader context
- Use both knowledge search AND web search when the query benefits from multiple perspectives
- Use specialized tools (weather, news, calculator, etc.) for specific types of information

SOURCE CITATION FORMAT:
When you use tools to gather information, always include a "Sources" section at the end of your response:

**Sources:**
- [Source Name](URL) - Brief description
- [Source Name](URL) - Brief description

SPECIFIC TOOL CITATIONS:
- Knowledge base searches: Use document title and mention the collection
- Web searches: Use the source name and URL from search results
- Wikipedia: Use the article title and URL
- News articles: Use the source name and URL
- Weather data: Mention "OpenWeatherMap" as the source
- Calculations: Mention "Internal Calculator"
- Other tools: Mention the appropriate service name

Always provide clear, properly formatted citations for transparency and credibility.`
        : "";

    const systemPrompt =
      baseSystemPrompt + knowledgeInstructions + toolInstructions;

    // Enhance the prompt with context if provided
    let enhancedPrompt = args.message;
    if (args.context && Object.keys(args.context).length > 0) {
      enhancedPrompt = `Context: ${JSON.stringify(args.context)}\n\nMessage: ${args.message}`;
    }

    console.log(
      `[MCP Agent Chat] Processing request for agent ${agent.name}:`,
      {
        agentId: agent.id,
        userId: agent.userId,
        agentTools: agent.tools,
        toolConfigsCount: enabledToolConfigs.length,
        availableToolsCount: Object.keys(allTools).length,
        toolNames: Object.keys(allTools),
      }
    );

    // Generate response with tools
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: enhancedPrompt,
      tools: Object.keys(allTools).length > 0 ? allTools : undefined,
      temperature: 0.7,
      maxTokens: 2000,
      maxSteps: 5,
    });

    console.log(
      `[MCP Agent Chat] Generated response with ${result.steps?.length || 0} steps`
    );

    return result.text;
  } catch (error) {
    console.error("[MCP Agent] Error in chat tool:", error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}

async function handleChatToolStreaming(
  agent: any,
  args: any
): Promise<Response> {
  try {
    // Import required modules for streaming
    const { streamText } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");
    const { createToolsFromConfig, getUserToolConfigurations } = await import(
      "@/lib/tools"
    );

    // Get user's tool configurations and create tools
    let tools = {};
    let enabledToolConfigs: any[] = [];

    if (agent.userId && agent.userId.trim() !== "") {
      try {
        console.log(
          `[MCP Agent Streaming] Loading tool configurations for user ${agent.userId}`
        );
        console.log(`[MCP Agent Streaming] Agent tools array:`, agent.tools);

        const toolConfigs = await getUserToolConfigurations(agent.userId);
        console.log(
          `[MCP Agent Streaming] Found ${toolConfigs.length} tool configurations:`,
          toolConfigs.map((c) => ({
            toolId: c.toolId,
            isEnabled: c.isEnabled,
            hasApiKey: !!c.apiKey,
          }))
        );

        // Log detailed filtering process
        const filteredConfigs = toolConfigs.filter((config: any) => {
          const isEnabled = config.isEnabled;
          const isInAgentTools = agent.tools?.includes(config.toolId);

          console.log(
            `[MCP Agent Streaming] Tool ${config.toolId}: enabled=${isEnabled}, inAgentTools=${isInAgentTools}, hasApiKey=${!!config.apiKey}`
          );

          return isEnabled && isInAgentTools;
        });

        enabledToolConfigs = filteredConfigs.map((config: any) => ({
          toolId: config.toolId,
          isEnabled: config.isEnabled,
          apiKey: config.apiKey,
          config: config.config,
        }));

        tools = createToolsFromConfig(enabledToolConfigs);
        console.log(
          `[MCP Agent Streaming] Created ${Object.keys(tools).length} tools:`,
          Object.keys(tools)
        );
      } catch (error) {
        console.warn(
          `[MCP Agent Streaming] Failed to load tool configurations for user ${agent.userId}:`,
          error
        );
        tools = {};
        enabledToolConfigs = [];
      }
    }

    // Add knowledge search tool if agent has collections
    let allTools = tools;
    if (agent.collections && agent.collections.length > 0) {
      const { createKnowledgeSearchTool } = await import(
        "@/lib/tools/knowledge-search"
      );
      const knowledgeSearchTool = createKnowledgeSearchTool(agent);
      allTools = {
        ...tools,
        search_knowledge: knowledgeSearchTool,
      };
      console.log(
        `[MCP Agent Streaming] Added knowledge search tool for ${agent.collections.length} collections`
      );
    }

    // Build the system prompt with consistent tool instructions
    const baseSystemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Add knowledge base instructions if agent has collections
    const knowledgeInstructions =
      agent.collections && agent.collections.length > 0
        ? `\n\nKNOWLEDGE BASE ACCESS:
You have access to a knowledge base containing ${agent.collections.length} collection(s) of documents. This knowledge base contains authoritative information for your domain.

WHEN TO USE KNOWLEDGE SEARCH:
- When users ask questions that might be answered by information in your knowledge base
- For domain-specific information that could be in your collections
- When you need specific facts, data, or detailed information from your knowledge base
- When users ask about topics that could be covered in your collections

COMBINING KNOWLEDGE SEARCH WITH OTHER TOOLS:
- Use knowledge search for domain-specific information from your collections
- Use web search tools (like Tavily) for current events, recent information, or topics outside your knowledge base
- When appropriate, use BOTH knowledge search AND web search to provide comprehensive answers
- Knowledge base information should be considered authoritative for your domain
- Web search provides current and broader context

HOW TO USE KNOWLEDGE SEARCH RESULTS:
1. Search your knowledge base when the query relates to your domain expertise
2. Use the 'search_knowledge' tool with specific keywords from the user's question
3. Prioritize information from higher relevance scores (shown as percentages)
4. Synthesize information from multiple results when relevant
5. If results contradict each other, acknowledge the discrepancy and explain
6. Always cite your sources using the provided citation format

CITATION REQUIREMENTS:
- Always cite sources when using information from knowledge search results
- Use the citation format provided in the search results
- Reference document titles and relevance scores when helpful
- If multiple sources support the same point, cite all relevant sources
- Format citations clearly at the end of your response in a "Sources:" section

SYNTHESIS GUIDELINES:
- Combine information from knowledge base AND web search when both are relevant
- Explain how different pieces of information relate to each other
- If information is incomplete, acknowledge what's missing and consider using additional tools
- Use your general knowledge to provide context, but clearly distinguish between different information sources
- Clearly indicate which information comes from your knowledge base vs. web search vs. general knowledge

Remember: Use the most appropriate tools for each query. Your knowledge base is authoritative for your domain, but web search tools provide current and broader information.`
        : "";

    // Add tool usage instructions if tools are available
    const toolInstructions =
      Object.keys(allTools).length > 0
        ? `\n\nTOOL USAGE:
You have access to the following tools: ${Object.keys(allTools).join(", ")}. 

GENERAL TOOL GUIDELINES:
- Use tools when they would be helpful to answer the user's questions or complete their requests
- Consider using MULTIPLE tools when they provide complementary information
- For comprehensive answers, combine results from different tools (e.g., knowledge search + web search)
- Always incorporate the results from tool calls into your response
- Provide accurate and up-to-date information based on tool results
- If a tool fails or returns an error, acknowledge this and try alternative tools when available

TOOL SELECTION STRATEGY:
- Use knowledge search for domain-specific information from your collections
- Use web search (Tavily, DuckDuckGo) for current events, recent information, or broader context
- Use both knowledge search AND web search when the query benefits from multiple perspectives
- Use specialized tools (weather, news, calculator, etc.) for specific types of information

SOURCE CITATION FORMAT:
When you use tools to gather information, always include a "Sources" section at the end of your response:

**Sources:**
- [Source Name](URL) - Brief description
- [Source Name](URL) - Brief description

SPECIFIC TOOL CITATIONS:
- Knowledge base searches: Use document title and mention the collection
- Web searches: Use the source name and URL from search results
- Wikipedia: Use the article title and URL
- News articles: Use the source name and URL
- Weather data: Mention "OpenWeatherMap" as the source
- Calculations: Mention "Internal Calculator"
- Other tools: Mention the appropriate service name

Always provide clear, properly formatted citations for transparency and credibility.`
        : "";

    const systemPrompt =
      baseSystemPrompt + knowledgeInstructions + toolInstructions;

    // Enhance the prompt with context if provided
    let enhancedPrompt = args.message;
    if (args.context && Object.keys(args.context).length > 0) {
      enhancedPrompt = `Context: ${JSON.stringify(args.context)}\n\nMessage: ${args.message}`;
    }

    console.log(
      `[MCP Agent Streaming] Processing streaming request for agent ${agent.name}`
    );

    // Check if we have tools - if so, we need to use generateText first to ensure tools complete
    if (Object.keys(allTools).length > 0) {
      // For tool usage, we need to generate first then return the complete response
      // since tools need to complete before we can provide the final answer
      const { generateText } = await import("ai");

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: enhancedPrompt,
        tools: allTools,
        temperature: 0.7,
        maxTokens: 2000,
        maxSteps: 5,
      });

      // Extract tool calls with results from all steps
      const allToolCalls =
        result.steps?.flatMap(
          (step) =>
            step.toolCalls?.map((toolCall: any) => {
              // Find the corresponding tool result
              const toolResult = step.toolResults?.find(
                (result: any) => result.toolCallId === toolCall.toolCallId
              );

              return {
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
                result: (toolResult as any)?.result,
              };
            }) || []
        ) || [];

      console.log(
        `[MCP Agent Streaming] Generated response with ${allToolCalls.length} tool calls`
      );

      // Return the complete response as JSON since tools need to complete first
      return new Response(
        JSON.stringify({
          type: "text",
          text: result.text,
          toolCalls: allToolCalls,
          streaming: false,
          reason: "Tools were used - complete response required",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // No tools, can stream normally
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: enhancedPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      console.log(
        `[MCP Agent Streaming] Streaming response for agent: ${agent.name}`
      );

      // Return the streaming response with appropriate headers for MCP
      return new Response(result.toDataStream(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Streaming": "true",
        },
      });
    }
  } catch (error) {
    console.error("[MCP Agent] Error in streaming chat tool:", error);

    // Return error as JSON response
    return new Response(
      JSON.stringify({
        error:
          "I apologize, but I'm having trouble processing your request right now.",
        streaming: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

async function handleKnowledgeSearch(agent: any, args: any): Promise<string> {
  try {
    console.log(`[MCP Agent] Knowledge search request:`, {
      agentId: agent.id,
      agentUserId: agent.userId,
      query: args.query,
      limit: args.limit,
      collections: agent.collections,
    });

    if (!agent.collections || agent.collections.length === 0) {
      return JSON.stringify(
        {
          success: false,
          error: "No collections available for this agent",
          query: args.query,
          results: [],
        },
        null,
        2
      );
    }

    // Import the search function
    const { searchDocumentChunks } = await import(
      "@/app/(protected)/mycollections/actions"
    );

    // Search across all collections assigned to the agent
    const allResults = [];
    const limit = args.limit || 5;

    for (const collectionId of agent.collections) {
      console.log(
        `[MCP Agent] Searching collection: ${collectionId} for user: ${agent.userId}`
      );

      const searchResponse = await searchDocumentChunks(
        args.query,
        collectionId,
        1, // page
        limit, // pageSize
        agent.userId // Pass the agent's userId for authentication
      );

      if (searchResponse.success && searchResponse.results) {
        // Add collection context to results
        const resultsWithCollection = searchResponse.results.map((result) => ({
          ...result,
          source_collection: collectionId,
        }));

        allResults.push(...resultsWithCollection);
      } else {
        console.warn(
          `[MCP Agent] Failed to search collection ${collectionId}:`,
          searchResponse.error
        );
      }
    }

    // Sort all results by relevance score and limit
    const sortedResults = allResults
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);

    console.log(
      `[MCP Agent] Found ${sortedResults.length} total results across ${agent.collections.length} collections`
    );

    if (sortedResults.length === 0) {
      return JSON.stringify(
        {
          success: true,
          message:
            "No relevant documents found in the knowledge base for this query.",
          query: args.query,
          results: [],
          total_results: 0,
        },
        null,
        2
      );
    }

    // Format results for the agent
    const formattedResults = sortedResults.map((result, index) => ({
      rank: index + 1,
      title: result.document_title || result.filename || "Untitled Document",
      content: result.chunk_content,
      relevance_score: result.similarity,
      source_collection: result.source_collection,
      document_id: result.document_id,
      chunk_index: result.chunk_index,
      file_url: result.file_url,
    }));

    return JSON.stringify(
      {
        success: true,
        query: args.query,
        total_results: sortedResults.length,
        results: formattedResults,
        message: `Found ${sortedResults.length} relevant documents in the knowledge base.`,
      },
      null,
      2
    );
  } catch (error) {
    console.error("[MCP Agent] Error in knowledge search:", error);
    return JSON.stringify(
      {
        success: false,
        error: "Knowledge search failed",
        query: args.query,
        results: [],
        details: error instanceof Error ? error.message : "Unknown error",
      },
      null,
      2
    );
  }
}
