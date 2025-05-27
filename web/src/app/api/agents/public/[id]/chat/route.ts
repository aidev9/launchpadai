import { NextRequest } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Message } from "ai";
import { createToolsFromConfig, getUserToolConfigurations } from "@/lib/tools";
import { createKnowledgeSearchTool } from "@/lib/tools/knowledge-search";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    console.log(`[PublicAgentChat] Chat request for agent: ${agentId}`);

    if (!agentId) {
      return new Response(JSON.stringify({ error: "Agent ID is required" }), {
        status: 400,
      });
    }

    // Parse the request body
    const { messages }: { messages: Message[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400 }
      );
    }

    // Check response type preference
    const responseType = req.headers.get("X-Response-Type") || "streaming";

    // Get the agent using the public method (no authentication required)
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    console.log(`[PublicAgentChat] Agent found: ${!!agent}`);

    if (!agent) {
      return new Response(
        JSON.stringify({ error: "Agent not found or not enabled" }),
        { status: 404 }
      );
    }

    // Double-check that the agent is enabled
    if (!agent.configuration?.isEnabled) {
      return new Response(
        JSON.stringify({ error: "Agent is not enabled for public access" }),
        { status: 403 }
      );
    }

    console.log(
      `[PublicAgentChat] Agent ${agent.name} is enabled, processing chat with response type: ${responseType}`
    );

    // Get agent owner's tool configurations and create tools
    console.log(
      `[PublicAgentChat] Loading tool configurations for user ${agent.userId}`
    );
    console.log(`[PublicAgentChat] Agent tools array:`, agent.tools);

    const toolConfigs = await getUserToolConfigurations(agent.userId);
    console.log(
      `[PublicAgentChat] Found ${toolConfigs.length} tool configurations:`,
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
        `[PublicAgentChat] Tool ${config.toolId}: enabled=${isEnabled}, inAgentTools=${isInAgentTools}, hasApiKey=${!!config.apiKey}`
      );

      return isEnabled && isInAgentTools;
    });

    const enabledToolConfigs = filteredConfigs.map((config: any) => ({
      toolId: config.toolId,
      isEnabled: config.isEnabled,
      apiKey: config.apiKey,
      config: config.config,
    }));

    console.log(
      `[PublicAgentChat] Filtered to ${enabledToolConfigs.length} enabled tool configs for agent tools:`,
      enabledToolConfigs.map((c) => c.toolId)
    );

    const tools = createToolsFromConfig(enabledToolConfigs);

    // Add knowledge search tool if agent has collections
    let allTools = tools;
    if (agent.collections && agent.collections.length > 0) {
      const knowledgeSearchTool = createKnowledgeSearchTool(agent);
      allTools = {
        ...tools,
        search_knowledge: knowledgeSearchTool,
      };
      console.log(
        `[PublicAgentChat] Added knowledge search tool for ${agent.collections.length} collections`
      );
    }

    // Use the agent's system prompt or a default one
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

    // Create the system message
    const systemMessage: Message = {
      id: "system",
      role: "system",
      content: systemPrompt,
    };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    console.log(
      `[PublicAgentChat] Processing ${allMessages.length} messages with ${Object.keys(allTools).length} tools`
    );

    if (responseType === "single") {
      // Generate a single response
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        messages: allMessages,
        tools: Object.keys(allTools).length > 0 ? allTools : undefined,
        temperature: 0.7,
        maxTokens: 2000,
        maxSteps: 5, // Allow multiple steps for tool usage
      });

      // Extract tool calls with results from all steps
      const allToolCalls =
        result.steps?.flatMap(
          (step) =>
            step.toolCalls?.map((toolCall) => {
              // Find the corresponding tool result
              const toolResult = step.toolResults?.find(
                (result) => result.toolCallId === toolCall.toolCallId
              );

              return {
                ...toolCall,
                result: toolResult?.result,
              };
            }) || []
        ) || [];

      console.log(
        `[PublicAgentChat] Generated single response for agent: ${agent.name}`
      );

      // Return JSON response
      return new Response(
        JSON.stringify({
          response: result.text,
          toolCalls: allToolCalls,
          metadata: {
            agent_id: agent.id,
            timestamp: new Date().toISOString(),
            model: "gpt-4o-mini",
            tokens_used: result.usage?.totalTokens || 0,
            tools_used: allToolCalls.length,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // For tool usage, we need to generate first then stream to ensure tools complete
      if (Object.keys(allTools).length > 0) {
        // Generate with tools first to ensure completion
        const result = await generateText({
          model: openai("gpt-4o-mini"),
          messages: allMessages,
          tools: allTools,
          temperature: 0.7,
          maxTokens: 2000,
          maxSteps: 5, // Allow multiple steps for tool usage
        });

        // Extract tool calls with results from all steps
        const allToolCalls =
          result.steps?.flatMap(
            (step) =>
              step.toolCalls?.map((toolCall) => {
                // Find the corresponding tool result
                const toolResult = step.toolResults?.find(
                  (result) => result.toolCallId === toolCall.toolCallId
                );

                return {
                  ...toolCall,
                  result: toolResult?.result,
                };
              }) || []
          ) || [];

        console.log(
          `[PublicAgentChat] Generated response with tools for agent: ${agent.name}`
        );

        // Return the complete response as JSON since tools need to complete first
        return new Response(
          JSON.stringify({
            type: "text",
            text: result.text,
            toolCalls: allToolCalls,
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
          messages: allMessages,
          temperature: 0.7,
          maxTokens: 2000,
        });

        console.log(
          `[PublicAgentChat] Streaming response for agent: ${agent.name}`
        );

        // Return the streaming response
        return result.toDataStreamResponse();
      }
    }
  } catch (error) {
    console.error("[PublicAgentChat] Error processing chat request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
