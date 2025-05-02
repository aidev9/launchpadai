"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";
import { Message } from "ai";

// Type definition for AI model settings
export interface AIModelSettings {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

// Default settings if not provided
const defaultSettings: AIModelSettings = {
  modelId: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};

/**
 * Server action to enhance a prompt with AI and stream the results
 * @param promptText The prompt to enhance
 * @param instructions Optional instructions for how to enhance the prompt
 * @param settings Optional AI model settings
 * @returns An object with a streamable value for the enhanced prompt
 */
export async function enhancePromptStream(
  promptText: string,
  instructions?: string,
  settings?: Partial<AIModelSettings>
) {
  // Merge default settings with provided settings
  const finalSettings: AIModelSettings = {
    ...defaultSettings,
    ...settings,
  };

  // Create a streamable value for the output
  const stream = createStreamableValue("");

  // Start streaming in the background
  (async () => {
    try {
      // Prepare messages array
      const messages: Omit<Message, "id">[] = [
        { role: "system", content: PROMPT_ENHANCEMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Please enhance the following prompt to make it more effective for AI tools:\n\n${promptText}`,
        },
      ];

      // Add instructions if provided
      if (instructions && instructions.trim()) {
        messages.push({
          role: "user",
          content: `Please follow these specific instructions when enhancing the prompt: ${instructions}`,
        });
      }

      const result = await streamText({
        model: openai(finalSettings.modelId),
        messages,
        temperature: finalSettings.temperature,
        maxTokens: finalSettings.maxTokens,
        topP: finalSettings.topP,
      });

      // Stream the text deltas to the client
      const { textStream } = result;
      for await (const delta of textStream) {
        stream.update(delta);
      }

      // Complete the stream
      stream.done();
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      stream.error(
        "Failed to enhance prompt: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  })();

  // Return the streamable value for UI consumption
  return { output: stream.value };
}
