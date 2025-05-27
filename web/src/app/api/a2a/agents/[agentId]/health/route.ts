import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.agentId;

    console.log(`[A2A Health] Request for agent: ${agentId}`);

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
        {
          status: "unhealthy",
          error: "Agent not found or not enabled",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Check agent health status
    const isHealthy = agent.configuration.isEnabled;
    const hasApiKey = !!agent.configuration.apiKey;

    const healthStatus = {
      status: isHealthy && hasApiKey ? "healthy" : "degraded",
      agent_id: agent.id,
      agent_name: agent.name,
      checks: {
        agent_enabled: {
          status: isHealthy ? "pass" : "fail",
          description: "Agent is enabled and ready to receive requests",
        },
        api_key_configured: {
          status: hasApiKey ? "pass" : "fail",
          description: "API key is configured for authentication",
        },
        collections_available: {
          status:
            agent.collections && agent.collections.length > 0 ? "pass" : "warn",
          description: "Knowledge base collections are available",
          count: agent.collections?.length || 0,
        },
        tools_available: {
          status: agent.tools && agent.tools.length > 0 ? "pass" : "warn",
          description: "Tools are configured and available",
          count: agent.tools?.length || 0,
        },
      },
      capabilities: [
        "chat",
        "reasoning",
        ...(agent.collections && agent.collections.length > 0
          ? ["knowledge_search"]
          : []),
      ],
      metadata: {
        version: "1.0.0",
        uptime: "available",
        last_updated: agent.updatedAt,
        timestamp: new Date().toISOString(),
      },
    };

    // Return appropriate status code based on health
    const statusCode =
      healthStatus.status === "healthy"
        ? 200
        : healthStatus.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error("[A2A Health] Error processing request:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
