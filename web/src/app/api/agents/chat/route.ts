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

    // Use the agent's system prompt or a default one
    const systemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Create the system message
    const systemMessage: Message = {
      id: "system",
      role: "system",
      content: systemPrompt,
    };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    // Stream the AI response
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: allMessages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
