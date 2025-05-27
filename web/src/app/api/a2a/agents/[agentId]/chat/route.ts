import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[A2A Chat] Request for agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Get the agent using the public method
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    // Verify token - support both API key and OAuth token
    const isValidToken = await verifyToken(token, agent);
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid bearer token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { message: messageInput, context } = body;

    if (!messageInput) {
      return NextResponse.json(
        { error: "Message input is required" },
        { status: 400 }
      );
    }

    let userQueryText: string;
    if (typeof messageInput === "string") {
      userQueryText = messageInput;
    } else if (
      typeof messageInput === "object" &&
      messageInput !== null &&
      Array.isArray(messageInput.parts) &&
      messageInput.parts.length > 0 &&
      messageInput.parts[0].kind === "text" &&
      typeof messageInput.parts[0].text === "string"
    ) {
      // Handles A2A standard message format with 'parts'
      userQueryText = messageInput.parts[0].text;
    } else if (
      typeof messageInput === "object" &&
      messageInput !== null &&
      typeof messageInput.content === "string"
    ) {
      // Handles message format from the A2A testing UI with 'content'
      userQueryText = messageInput.content;
    } else {
      console.error(
        "[A2A Chat] Unexpected message input structure:",
        messageInput
      );
      return NextResponse.json(
        { error: "Invalid message format in input" },
        { status: 400 }
      );
    }

    // Ensure userQueryText is a string (it could be an empty string, which might be valid)
    if (typeof userQueryText !== "string") {
      console.error(
        "[A2A Chat] Failed to extract user query text from message input:",
        messageInput
      );
      return NextResponse.json(
        { error: "Message text could not be extracted or is not a string" },
        { status: 400 }
      );
    }

    // Handle chat request
    const chatResponse = await handleA2aChat(agent, userQueryText, context);

    return NextResponse.json({
      success: true,
      response: chatResponse,
      metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
        timestamp: new Date().toISOString(),
        conversation_id: context?.conversation_id,
        user_id: context?.user_id,
      },
    });
  } catch (error) {
    console.error("[A2A Chat] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to verify token (API key or OAuth token)
async function verifyToken(token: string, agent: any): Promise<boolean> {
  try {
    // First, check if it's the agent's API key
    if (agent.configuration.apiKey === token) {
      return true;
    }

    // Then, check if it's a valid OAuth access token
    try {
      const tokenData = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );

      // Verify it's an access token for this agent
      if (
        tokenData.type === "access_token" &&
        tokenData.agentId === agent.id &&
        tokenData.expiresAt > Date.now()
      ) {
        return true;
      }
    } catch (error) {
      // Token is not a valid base64 encoded JSON, continue to return false
    }

    return false;
  } catch (error) {
    console.error("[A2A Chat] Error verifying token:", error);
    return false;
  }
}

// Helper function to handle A2A chat
async function handleA2aChat(
  agent: any,
  message: string,
  context?: any
): Promise<string> {
  try {
    // Import the unified agent chat service
    const { AgentChatService } = await import("@/lib/agent-chat-service");

    const result = await AgentChatService.generateResponse({
      agent,
      message,
      userId: context?.user_id || "anonymous",
      context,
      maxTokens: 1000,
    });

    return result.text;
  } catch (error) {
    console.error("[A2A Chat] Error in chat:", error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}
