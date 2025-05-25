import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { agentId, message } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { error: "Agent ID and message are required" },
        { status: 400 }
      );
    }

    // Get the agent from Firebase
    const agent = await serverAgentsService.getAgentById(userId, agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Note: Permission check is implicit - if getAgentById returns an agent,
    // it means the agent belongs to the current user since we query from their collection

    // Check if the agent is enabled
    if (!agent.configuration.isEnabled) {
      return NextResponse.json(
        { error: "Agent is not enabled" },
        { status: 400 }
      );
    }

    // Use the agent's system prompt or a default one
    const systemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Generate response using the Vercel AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return NextResponse.json({
      response: text,
      metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
        timestamp: new Date().toISOString(),
        system_prompt_used: !!agent.systemPrompt,
      },
    });
  } catch (error) {
    console.error("Error testing agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
