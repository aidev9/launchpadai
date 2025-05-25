"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Message } from "ai";

/**
 * React Server Action to generate content based on a prompt template and user instructions
 * This is specifically designed for the Playground component
 */
export async function generatePlaygroundContent({
  promptTemplate,
  userInstructions,
  modelId = "gpt-4o",
  temperature = 0.8,
  maxTokens = 4096,
  topP = 0.95,
}: {
  promptTemplate: string;
  userInstructions?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}): Promise<ReadableStream<Uint8Array>> {
  // Basic validation
  if (!promptTemplate) {
    throw new Error("Prompt template is required");
  }

  // Combine the template with user instructions
  let finalPrompt = promptTemplate;

  if (userInstructions && userInstructions.trim()) {
    finalPrompt = `${promptTemplate}

ADDITIONAL INSTRUCTIONS FROM USER:
${userInstructions}

Please incorporate these additional instructions into your response while following the original template requirements.`;
  }

  const systemPrompt = `You are an expert AI assistant helping users create high-quality content based on their product development needs. 

Your task is to:
1. Follow the provided prompt template requirements exactly
2. Incorporate any additional user instructions seamlessly
3. Generate comprehensive, actionable, and specific content
4. Use clear formatting with headers, lists, and sections where appropriate
5. Provide concrete examples and specific implementation details
6. Ensure the output is professional and immediately usable

Focus on delivering practical, detailed results that the user can implement right away.`;

  const messages: Message[] = [
    {
      id: "system",
      role: "system",
      content: systemPrompt,
    },
    {
      id: "user",
      role: "user",
      content: finalPrompt,
    },
  ];

  // Create a TextEncoder
  const encoder = new TextEncoder();

  // Create a ReadableStream where we can write our SSE data
  return new ReadableStream({
    async start(controller) {
      try {
        // Create our AI stream with optimized parameters
        const aiStream = streamText({
          model: openai(modelId),
          messages,
          temperature,
          maxTokens,
          topP,
          frequencyPenalty: 0.1, // Reduce repetition
          presencePenalty: 0.1, // Encourage diverse content
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
        console.error("Error in playground content generation:", error);
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
