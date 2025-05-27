import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

// A2A Protocol types
interface A2aCapability {
  name: string;
  description: string;
  version: string;
  parameters?: Record<string, any>;
}

interface A2aAgentInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: A2aCapability[];
  endpoints: {
    chat: string;
    capabilities: string;
    health: string;
  };
  authentication: {
    type: string;
    scopes: string[];
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[A2A Agent] GET request for agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get the agent using the public method
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    const baseUrl = req.nextUrl.origin;

    // Return agent discovery information
    const agentInfo: A2aAgentInfo = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: "1.0.0",
      capabilities: [
        {
          name: "chat",
          description: "Conversational AI capability",
          version: "1.0.0",
          parameters: {
            maxTokens: 2000,
            supportedLanguages: ["en"],
            conversationTypes: ["single-turn", "multi-turn"],
          },
        },
        {
          name: "reasoning",
          description: "Logical reasoning and problem-solving",
          version: "1.0.0",
        },
        ...(agent.collections && agent.collections.length > 0
          ? [
              {
                name: "knowledge_search",
                description: "Search through knowledge base",
                version: "1.0.0",
                parameters: {
                  collections: agent.collections.length,
                  searchTypes: ["semantic", "keyword"],
                },
              },
            ]
          : []),
      ],
      endpoints: {
        chat: `${baseUrl}/api/a2a/agents/${agent.id}/chat`,
        capabilities: `${baseUrl}/api/a2a/agents/${agent.id}/capabilities`,
        health: `${baseUrl}/api/a2a/agents/${agent.id}/health`,
      },
      authentication: {
        type: "bearer_token",
        scopes: ["agent.chat", "agent.read"],
      },
    };

    return NextResponse.json(agentInfo);
  } catch (error) {
    console.error("[A2A Agent] Error processing GET request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[A2A Agent] POST request for agent: ${agentId}`);

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
    const { action, message, context } = body;

    // Handle different A2A actions
    switch (action) {
      case "chat":
        if (!message) {
          return NextResponse.json(
            { error: "Message is required for chat action" },
            { status: 400 }
          );
        }

        const chatResponse = await handleA2aChat(agent, message, context);
        return NextResponse.json({
          success: true,
          response: chatResponse,
          metadata: {
            agent_id: agent.id,
            timestamp: new Date().toISOString(),
            conversation_id: context?.conversation_id,
          },
        });

      case "get_capabilities":
        return NextResponse.json({
          success: true,
          capabilities: [
            "chat",
            "reasoning",
            ...(agent.collections && agent.collections.length > 0
              ? ["knowledge_search"]
              : []),
          ],
          metadata: {
            agent_id: agent.id,
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[A2A Agent] Error processing POST request:", error);
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
    console.error("[A2A Agent] Error verifying token:", error);
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
    console.error("[A2A Agent] Error in chat:", error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}
