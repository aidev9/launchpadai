// web/src/app/api/prompt-enhance/route.ts
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
      });
    }

    // Parse request body
    const { promptText, instructions, contextualInfo } = await req.json();

    if (!promptText) {
      return new Response(
        JSON.stringify({ error: "Prompt text is required" }),
        {
          status: 400,
        }
      );
    }

    // Build system prompt
    const systemPrompt = `You are an AI prompt enhancement assistant that helps create better, more effective prompts.
Your task is to enhance and improve the provided prompt based on:
1. The original prompt content
2. Any specific instructions provided by the user
3. Contextual information about the user's product, business, and technical stack

Guidelines:
- Keep the enhanced prompt well-structured and clear
- Maintain the original intent but make it more effective
- Add relevant details from the contextual information 
- Follow any specific enhancement instructions provided
- Format the output as markdown when appropriate
- Do not add unnecessary fluff or lengthen the prompt without purpose
- Focus on making the prompt more specific, actionable, and aligned with the user's context`;

    // Build user prompt
    let userPrompt = `Original Prompt:
${promptText}

`;

    if (contextualInfo && contextualInfo.trim()) {
      userPrompt += `Contextual Information:
${contextualInfo}

`;
    }

    if (instructions && instructions.trim()) {
      userPrompt += `Enhancement Instructions:
${instructions}

`;
    }

    userPrompt += `Please enhance this prompt to make it more effective and aligned with the provided context.`;

    // Create message array
    const messages: { role: "system" | "user"; content: string }[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    // Stream the AI response
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return new Response(JSON.stringify({ error: "Failed to enhance prompt" }), {
      status: 500,
    });
  }
}
