import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createToolsFromConfig, getUserToolConfigurations } from "@/lib/tools";

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

    // Get user's tool configurations and create tools
    const toolConfigs = await getUserToolConfigurations(userId);
    const enabledToolConfigs = toolConfigs
      .filter(
        (config: any) =>
          config.isEnabled && agent.tools?.includes(config.toolId)
      )
      .map((config: any) => ({
        toolId: config.toolId,
        isEnabled: config.isEnabled,
        apiKey: config.apiKey,
        config: config.config,
      }));
    const tools = createToolsFromConfig(enabledToolConfigs);

    // Use the agent's system prompt or a default one
    const baseSystemPrompt =
      agent.systemPrompt ||
      `You are ${agent.name}, an AI assistant. ${agent.description}`;

    // Add tool usage instructions if tools are available
    const toolInstructions =
      Object.keys(tools).length > 0
        ? `\n\nYou have access to the following tools: ${Object.keys(tools).join(", ")}. Use these tools when they would be helpful to answer the user's questions or complete their requests. Always incorporate the results from tool calls into your response to provide accurate and up-to-date information.

IMPORTANT: When you use tools to gather information, always include a "Sources" section at the end of your response that lists all the sources you used. Format it like this:

**Sources:**
- [Source Name](URL) - Brief description
- [Source Name](URL) - Brief description

For search results, use the source and URL from each result. For Wikipedia, use the article title and URL. For news articles, use the source name and URL. For weather data, mention "OpenWeatherMap" as the source. For calculations, mention "Internal Calculator". For other tools, mention the appropriate service name.`
        : "";

    const systemPrompt = baseSystemPrompt + toolInstructions;

    console.log(
      `[Agent Test] Using ${Object.keys(tools).length} tools:`,
      Object.keys(tools)
    );

    // Generate response using the Vercel AI SDK
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: message,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      temperature: 0.7,
      maxTokens: 1000,
      maxSteps: 5, // Allow multiple steps for tool usage
    });

    // Extract tool calls with results from all steps
    const allToolCalls =
      result.steps?.flatMap(
        (step) =>
          step.toolCalls?.map((toolCall) => {
            // Find the corresponding tool result
            const toolResult = step.toolResults?.find(
              (result) => result.toolCallId === toolCall.toolCallId
            );

            return {
              ...toolCall,
              result: toolResult?.result,
            };
          }) || []
      ) || [];

    console.log(`[Agent Test] Tool calls with results:`, allToolCalls);

    return NextResponse.json({
      response: result.text,
      toolCalls: allToolCalls,
      metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
        timestamp: new Date().toISOString(),
        system_prompt_used: !!agent.systemPrompt,
        tools_used: allToolCalls.length,
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
