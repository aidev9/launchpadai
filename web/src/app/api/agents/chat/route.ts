import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
      });
    }

    // Parse the request body
    const { messages, agentId }: { messages: Message[]; agentId: string } =
      await req.json();

    if (!agentId || !messages) {
      return new Response(
        JSON.stringify({ error: "Agent ID and messages are required" }),
        { status: 400 }
      );
    }

    // Get the agent from Firebase
    const agent = await serverAgentsService.getAgentById(userId, agentId);
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
      });
    }

    // Debug logging
    console.log("[Agent Chat] Debug info:", {
      currentUserId: userId,
      agentUserId: agent.userId,
      agentId: agent.id,
      userIdMatch: agent.userId === userId,
    });

    // Note: Permission check is implicit - if getAgentById returns an agent,
    // it means the agent belongs to the current user since we query from their collection

    // Check if the agent is enabled
    if (!agent.configuration.isEnabled) {
      return new Response(JSON.stringify({ error: "Agent is not enabled" }), {
        status: 400,
      });
    }

    // Extract the user message from the messages array
    const userMessage =
      messages.find((msg) => msg.role === "user")?.content || "";

    console.log(
      `[Agent Chat] Processing message: "${userMessage}" for agent: ${agent.name}`
    );

    // Check if agent has tools or collections - if so, use sequential tool calling
    const hasCollections = agent.collections && agent.collections.length > 0;

    // Check if agent has enabled tools by actually loading the tool configurations
    let hasEnabledTools = false;
    if (agent.tools && agent.tools.length > 0) {
      try {
        const { getUserToolConfigurations, createToolsFromConfig } =
          await import("@/lib/tools");

        console.log(
          `[Agent Chat] Checking tool configurations for user ${userId}`
        );
        const toolConfigs = await getUserToolConfigurations(userId);
        const filteredConfigs = toolConfigs.filter((config: any) => {
          return config.isEnabled && agent.tools?.includes(config.toolId);
        });

        const enabledToolConfigs = filteredConfigs.map((config: any) => ({
          toolId: config.toolId,
          isEnabled: config.isEnabled,
          apiKey: config.apiKey,
          config: config.config,
        }));

        const tools = createToolsFromConfig(enabledToolConfigs);
        hasEnabledTools = Object.keys(tools).length > 0;

        console.log(
          `[Agent Chat] Found ${Object.keys(tools).length} enabled tools: [${Object.keys(tools).join(", ")}]`
        );
      } catch (error) {
        console.warn(
          `[Agent Chat] Failed to check tool configurations:`,
          error
        );
        hasEnabledTools = false;
      }
    }

    if (hasEnabledTools || hasCollections) {
      console.log(
        `[Agent Chat] Agent has enabled tools (${hasEnabledTools}) or collections (${hasCollections}), using sequential tool calling approach`
      );

      // Use AgentChatService for sequential tool calling
      const { AgentChatService } = await import("@/lib/agent-chat-service");

      const result = await AgentChatService.generateResponse({
        agent,
        message: userMessage,
        userId: userId,
        maxTokens: 2000,
        temperature: 0.7,
        maxSteps: 5,
      });

      console.log(
        `[Agent Chat] Sequential tool calling completed with ${result.toolCalls.length} tool calls`
      );

      // Return the complete response as JSON since tools need to complete first
      return new Response(
        JSON.stringify({
          type: "text",
          text: result.text,
          toolCalls: result.toolCalls,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      console.log(
        `[Agent Chat] Agent has no enabled tools or collections, using simple streaming response`
      );

      // No tools or collections, use simple streaming response
      const baseSystemPrompt =
        agent.systemPrompt ||
        `You are ${agent.name}, an AI assistant. ${agent.description}`;

      // Create the system message
      const systemMessage: Message = {
        id: "system",
        role: "system",
        content: baseSystemPrompt,
      };

      // Combine system message with user messages
      const allMessages = [systemMessage, ...messages];

      // Stream the response
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: allMessages,
        temperature: 0.7,
        maxTokens: 2000,
      });

      // Return the streaming response
      return result.toDataStreamResponse();
    }
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
