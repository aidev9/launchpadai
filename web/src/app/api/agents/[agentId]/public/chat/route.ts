import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[Agent Public Chat] Request for agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.headers.get("mcp-api-key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Get the agent using the public method
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    console.log(
      `[Agent Public Chat] Agent found: ${agent.name}, userId: ${agent.userId || "undefined"}`
    );

    if (!agent.userId) {
      console.warn(
        `[Agent Public Chat] Agent ${agent.name} has no userId - tools will be disabled`
      );
    }

    // Verify API key matches
    if (agent.configuration.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Handle chat request
    const chatResponse = await handleAgentChat(agent, message, context);

    return NextResponse.json({
      response: chatResponse,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Agent Public Chat] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to handle agent chat
async function handleAgentChat(
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
    console.error("[Agent Public Chat] Error in chat:", error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}
