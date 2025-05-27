import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[A2A Capabilities] Request for agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get the agent using the public method (no auth required for capabilities discovery)
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    // Return agent capabilities
    const capabilities = {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_description: agent.description,
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
          parameters: {
            complexityLevels: ["basic", "intermediate", "advanced"],
            domains: ["general", "technical", "creative"],
          },
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
                  maxResults: 10,
                },
              },
            ]
          : []),
      ],
      endpoints: {
        chat: `${req.nextUrl.origin}/api/a2a/agents/${agent.id}/chat`,
        capabilities: `${req.nextUrl.origin}/api/a2a/agents/${agent.id}/capabilities`,
        health: `${req.nextUrl.origin}/api/a2a/agents/${agent.id}/health`,
      },
      authentication: {
        type: "bearer_token",
        scopes: ["agent.chat", "agent.read"],
        description: "Use the agent's API key as the bearer token",
      },
      metadata: {
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
        tools_count: agent.tools?.length || 0,
        collections_count: agent.collections?.length || 0,
      },
    };

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error("[A2A Capabilities] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
