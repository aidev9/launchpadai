"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Message } from "ai";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";
import { Readable } from "stream";

/**
 * React Server Action to enhance a prompt using AI
 * This replicates the functionality of the api/prompt-stream endpoint
 * but as a server action that can be directly used from React components
 */
export async function enhancePromptStream({
  promptText,
  instructions,
  modelId = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 2048,
  topP = 0.9,
  contextualInfo = "",
}: {
  promptText: string;
  instructions?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  contextualInfo?: string;
}): Promise<ReadableStream<Uint8Array>> {
  // Basic validation
  if (!promptText) {
    throw new Error("Prompt text is required");
  }

  // Set up the messages for the AI
  const enhancementInstructions =
    instructions ||
    "Enhance this prompt to be more effective, specific, and likely to produce good results with AI tools.";

  const messages: Message[] = [
    {
      id: "system",
      role: "system",
      content: PROMPT_ENHANCEMENT_SYSTEM_PROMPT,
    },
    {
      id: "user",
      role: "user",
      content: `${enhancementInstructions}

${contextualInfo ? "Here is some context about the project:\n\n" + contextualInfo + "\n\n" : ""}

PROMPT TO ENHANCE:
${promptText}`,
    },
  ];

  // Create a TextEncoder
  const encoder = new TextEncoder();

  // Create a ReadableStream where we can write our SSE data
  return new ReadableStream({
    async start(controller) {
      try {
        // Create our AI stream
        const aiStream = streamText({
          model: openai(modelId),
          messages,
          temperature,
          maxTokens,
          topP,
        });

        // Consume the stream using the textStream property and a reader
        const reader = aiStream.textStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Format as SSE data - ensuring we properly escape newlines
          // We need to encode the value as JSON to preserve newlines
          const formattedData = `data: ${JSON.stringify(value)}\n\n`;
          controller.enqueue(encoder.encode(formattedData));
        }

        // Send a 'done' event to indicate we're finished
        const doneEvent = encoder.encode("event: done\ndata: \n\n");
        controller.enqueue(doneEvent);
      } catch (error) {
        console.error("Error in stream reading:", error);
        // Send an error event
        const errorEvent = encoder.encode(
          `event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`
        );
        controller.enqueue(errorEvent);
      } finally {
        controller.close();
      }
    },
  });
}
