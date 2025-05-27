import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    console.log(`[EnableAgentAPI] Enabling agent: ${agentId}`);

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get the current agent
    const currentAgent = await serverAgentsService.getAgentById(
      userId,
      agentId
    );

    if (!currentAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    console.log(
      `[EnableAgentAPI] Current agent enabled: ${currentAgent.configuration?.isEnabled}`
    );

    // Update the agent to enable it
    const updatedAgent = {
      ...currentAgent,
      configuration: {
        ...currentAgent.configuration,
        isEnabled: true,
      },
    };

    const result = await serverAgentsService.updateAgent(userId, updatedAgent);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to enable agent" },
        { status: 500 }
      );
    }

    console.log(`[EnableAgentAPI] Agent enabled successfully`);

    return NextResponse.json({
      success: true,
      message: "Agent enabled successfully",
      agent: {
        id: result.id,
        name: result.name,
        description: result.description,
        configuration: {
          isEnabled: result.configuration.isEnabled,
        },
      },
    });
  } catch (error) {
    console.error("[EnableAgentAPI] Error enabling agent:", error);
    return NextResponse.json(
      { error: "Failed to enable agent" },
      { status: 500 }
    );
  }
}
