import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createToolsFromConfig, getUserToolConfigurations } from "@/lib/tools";
import { createKnowledgeSearchTool } from "@/lib/tools/knowledge-search";
import { Agent } from "@/lib/firebase/schema";

export interface AgentChatOptions {
  agent: Agent;
  message: string;
  userId: string;
  context?: any;
  maxTokens?: number;
  temperature?: number;
  maxSteps?: number;
}

export interface AgentChatResult {
  text: string;
  toolCalls: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    result: any;
  }>;
  usage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Unified agent chat service that handles tool calling and system prompts consistently
 * across all integration endpoints (API, MCP, A2A, IFrame)
 */
export class AgentChatService {
  /**
   * Generate a chat response using the agent with sequential tool calling strategy
   */
  static async generateResponse(
    options: AgentChatOptions
  ): Promise<AgentChatResult> {
    const {
      agent,
      message,
      userId,
      context,
      maxTokens = 2000,
      temperature = 0.7,
      maxSteps = 5,
    } = options;

    console.log(
      `[AgentChatService] Starting sequential tool calling for agent ${agent.name}`
    );
    console.log(
      `[AgentChatService] Agent tools: [${agent.tools?.join(", ") || "none"}]`
    );
    console.log(
      `[AgentChatService] Agent collections: [${agent.collections?.join(", ") || "none"}]`
    );

    // Step 1: Get user's tool configurations and create tools
    let tools = {};
    let enabledToolConfigs: any[] = [];
    const allToolResults: Array<{
      toolName: string;
      args: any;
      result: any;
      source: "web" | "knowledge";
    }> = [];

    if (userId && userId.trim() !== "") {
      try {
        console.log(
          `[AgentChatService] Loading tool configurations for user ${userId}`
        );

        const toolConfigs = await getUserToolConfigurations(userId);
        console.log(
          `[AgentChatService] Found ${toolConfigs.length} total tool configurations`
        );

        const filteredConfigs = toolConfigs.filter((config: any) => {
          const isEnabled = config.isEnabled;
          const isInAgentTools = agent.tools?.includes(config.toolId);

          console.log(
            `[AgentChatService] Tool ${config.toolId}: enabled=${isEnabled}, inAgentTools=${isInAgentTools}, hasApiKey=${!!config.apiKey}`
          );

          return isEnabled && isInAgentTools;
        });

        console.log(
          `[AgentChatService] Filtered to ${filteredConfigs.length} enabled tools for this agent`
        );

        enabledToolConfigs = filteredConfigs.map((config: any) => ({
          toolId: config.toolId,
          isEnabled: config.isEnabled,
          apiKey: config.apiKey,
          config: config.config,
        }));

        tools = createToolsFromConfig(enabledToolConfigs);
        console.log(
          `[AgentChatService] Created ${Object.keys(tools).length} web search tools:`,
          Object.keys(tools)
        );
      } catch (error) {
        console.warn(
          `[AgentChatService] Failed to load tool configurations:`,
          error
        );
      }
    } else {
      console.log(
        `[AgentChatService] No userId provided, skipping tool configuration loading`
      );
    }

    // Step 2: Execute all web search tools sequentially
    if (Object.keys(tools).length > 0) {
      console.log(
        `[AgentChatService] Executing ${Object.keys(tools).length} web search tools...`
      );

      for (const [toolName, tool] of Object.entries(tools)) {
        try {
          console.log(`[AgentChatService] Calling ${toolName}...`);

          // Create a simple prompt to extract search query from the user's message
          const searchQueryResult = await generateText({
            model: openai("gpt-4o-mini"),
            system:
              "Extract the main search query from the user's message. Return only the search query, no additional text.",
            prompt: message,
            maxTokens: 100,
          });

          const searchQuery = searchQueryResult.text.trim();
          console.log(
            `[AgentChatService] Using search query: "${searchQuery}"`
          );

          // Execute the tool with the search query
          const toolResult = await (tool as any).execute(
            { query: searchQuery, maxResults: 5 },
            {
              toolCallId: `call_${toolName}_${Date.now()}`,
              messages: [],
              abortSignal: new AbortController().signal,
            }
          );

          allToolResults.push({
            toolName,
            args: { query: searchQuery },
            result: toolResult,
            source: "web",
          });

          console.log(`[AgentChatService] ${toolName} completed successfully`);
        } catch (error) {
          console.error(
            `[AgentChatService] Error executing ${toolName}:`,
            error
          );
          allToolResults.push({
            toolName,
            args: { query: message },
            result: { error: (error as Error).message },
            source: "web",
          });
        }
      }
    }

    // Step 3: Execute knowledge search if agent has collections
    if (agent.collections && agent.collections.length > 0) {
      try {
        console.log(`[AgentChatService] Executing knowledge search...`);

        const knowledgeSearchTool = createKnowledgeSearchTool(agent);
        const knowledgeResult = await knowledgeSearchTool.execute(
          { query: message, limit: 5 },
          {
            toolCallId: `call_knowledge_${Date.now()}`,
            messages: [],
            abortSignal: new AbortController().signal,
          }
        );

        allToolResults.push({
          toolName: "search_knowledge",
          args: { query: message, limit: 5 },
          result: knowledgeResult,
          source: "knowledge",
        });

        console.log(
          `[AgentChatService] Knowledge search completed successfully`
        );
      } catch (error) {
        console.error(
          `[AgentChatService] Error executing knowledge search:`,
          error
        );
        allToolResults.push({
          toolName: "search_knowledge",
          args: { query: message, limit: 5 },
          result: { error: (error as Error).message },
          source: "knowledge",
        });
      }
    }

    // Step 4: Build synthesis prompt with all results
    const baseSystemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Prepare tool results for synthesis
    let toolResultsText = "";
    const sourcesList: string[] = [];

    if (allToolResults.length > 0) {
      toolResultsText = "\n\nTOOL RESULTS:\n";

      allToolResults.forEach((toolResult, index) => {
        toolResultsText += `\n--- ${toolResult.toolName.toUpperCase()} RESULTS ---\n`;

        if (toolResult.result.error) {
          toolResultsText += `Error: ${toolResult.result.error}\n`;
        } else if (toolResult.source === "web") {
          // Handle web search results
          if (
            toolResult.result.results &&
            Array.isArray(toolResult.result.results)
          ) {
            toolResult.result.results.forEach((result: any, idx: number) => {
              toolResultsText += `${idx + 1}. ${result.title}\n`;
              toolResultsText += `   ${result.content || result.snippet || result.description}\n`;
              if (result.url) {
                toolResultsText += `   URL: ${result.url}\n`;
                sourcesList.push(
                  `[${result.title}](${result.url}) - ${toolResult.toolName} search result`
                );
              }
            });
          } else {
            toolResultsText +=
              JSON.stringify(toolResult.result, null, 2) + "\n";
          }
        } else if (toolResult.source === "knowledge") {
          // Handle knowledge search results
          if (
            toolResult.result.results &&
            Array.isArray(toolResult.result.results)
          ) {
            toolResult.result.results.forEach((result: any, idx: number) => {
              toolResultsText += `${idx + 1}. ${result.title}\n`;
              toolResultsText += `   ${result.content}\n`;
              toolResultsText += `   Relevance: ${result.relevance_score}%\n`;
              if (result.source_url) {
                sourcesList.push(
                  `[${result.title}](${result.source_url}) - Knowledge base document`
                );
              }
            });
          } else {
            toolResultsText +=
              JSON.stringify(toolResult.result, null, 2) + "\n";
          }
        }
      });
    }

    // Build the synthesis system prompt
    const synthesisSystemPrompt = `${baseSystemPrompt}

SYNTHESIS INSTRUCTIONS:
You have been provided with search results from multiple sources including web search and knowledge base. Your task is to:

1. Analyze ALL the provided tool results
2. Create a comprehensive, well-structured response that synthesizes information from all sources
3. Prioritize knowledge base information as authoritative for domain-specific topics
4. Use web search results to provide current information and broader context
5. Clearly distinguish between different types of information sources
6. If information conflicts, acknowledge the discrepancy and explain
7. Provide a cohesive answer that addresses the user's question completely

IMPORTANT: Do NOT include source citations in your main response. Sources will be automatically appended at the end.

Focus on creating a comprehensive, well-organized response that makes the best use of all available information.`;

    // Enhance the prompt with context if provided
    let enhancedPrompt = message;
    if (context && Object.keys(context).length > 0) {
      enhancedPrompt = `Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`;
    } else {
      enhancedPrompt = `User Question: ${message}`;
    }

    // Add tool results to the prompt
    enhancedPrompt += toolResultsText;

    console.log(
      `[AgentChatService] Generating synthesis response with ${allToolResults.length} tool results`
    );

    // Step 5: Generate final synthesis response
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: synthesisSystemPrompt,
      prompt: enhancedPrompt,
      temperature,
      maxTokens,
    });

    // Step 6: Append sources to the response
    let finalText = result.text;
    if (sourcesList.length > 0) {
      finalText += "\n\n**Sources:**\n";
      sourcesList.forEach((source, index) => {
        finalText += `${index + 1}. ${source}\n`;
      });
    }

    // Convert tool results to the expected format for compatibility
    const formattedToolCalls = allToolResults.map((toolResult, index) => ({
      toolCallId: `call_${index}`,
      toolName: toolResult.toolName,
      args: toolResult.args,
      result: toolResult.result,
    }));

    console.log(
      `[AgentChatService] Synthesis complete. Generated response with ${formattedToolCalls.length} tool calls`
    );

    return {
      text: finalText,
      toolCalls: formattedToolCalls,
      usage: result.usage,
    };
  }

  /**
   * Generate a simple response without tools (for basic chat scenarios)
   */
  static async generateSimpleResponse(
    agent: Agent,
    message: string,
    context?: any,
    maxTokens: number = 1000
  ): Promise<string> {
    const baseSystemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    let enhancedPrompt = message;
    if (context && Object.keys(context).length > 0) {
      enhancedPrompt = `Context: ${JSON.stringify(context)}\n\nMessage: ${message}`;
    }

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: baseSystemPrompt,
      prompt: enhancedPrompt,
      temperature: 0.7,
      maxTokens,
    });

    return result.text;
  }
}
