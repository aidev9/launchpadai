import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    console.log(`[PublicAgentAPI] Fetching agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Fetch agent data using server-side Firebase
    const agent = await serverAgentsService.getPublicAgentById(agentId);

    console.log(`[PublicAgentAPI] Agent found: ${!!agent}`);
    if (agent) {
      console.log(
        `[PublicAgentAPI] Agent enabled: ${agent.configuration?.isEnabled}`
      );
    }

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or not enabled" },
        { status: 404 }
      );
    }

    // Only return public information needed for embedding
    const publicAgentData = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      configuration: {
        isEnabled: agent.configuration.isEnabled,
      },
    };

    console.log(`[PublicAgentAPI] Returning agent data:`, publicAgentData);
    return NextResponse.json(publicAgentData);
  } catch (error) {
    console.error("[PublicAgentAPI] Error fetching agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}
