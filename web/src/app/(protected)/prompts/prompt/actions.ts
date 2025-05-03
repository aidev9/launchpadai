"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";
import { Message } from "ai";
import { Product } from "@/lib/store/product-store";
import { getOrderedProductQuestions } from "@/lib/firebase/actions/questions";
import { getProjectNotes } from "@/lib/firebase/notes";
import { Question } from "@/lib/firebase/schema";

// Type definition for AI model settings
export interface AIModelSettings {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

// Define types for questions and notes

interface ProductNote {
  id: string;
  note_body: string;
  tags?: string[];
  last_modified?: Date;
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
 * @param selectedProduct Optional product context to include in enhancement
 * @returns An object with a streamable value for the enhanced prompt
 */
export async function enhancePromptStream(
  promptText: string,
  instructions?: string,
  settings?: Partial<AIModelSettings>,
  selectedProduct?: Product | null
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
      // Basic prompt starts with just the text
      const userPrompt = `Please enhance the following prompt to make it more effective for AI tools:\n\n${promptText}`;

      // Prepare messages array with system prompt
      const messages: Omit<Message, "id">[] = [
        { role: "system", content: PROMPT_ENHANCEMENT_SYSTEM_PROMPT },
      ];

      // Add product context if provided
      let productContext = "";
      if (selectedProduct && selectedProduct.id) {
        // Fetch questions and notes for this product
        productContext = `I'm providing additional context about the product this prompt is related to:\n`;
        productContext += `- Product Name: ${selectedProduct.name}\n`;

        if (selectedProduct.description) {
          productContext += `- Description: ${selectedProduct.description}\n`;
        }

        if (selectedProduct.problem) {
          productContext += `- Problem: ${selectedProduct.problem}\n`;
        }

        if (selectedProduct.stage) {
          productContext += `- Stage: ${selectedProduct.stage}\n`;
        }

        // Add product questions if available
        try {
          const questionsResponse = await getOrderedProductQuestions(
            selectedProduct.id
          );

          if (
            questionsResponse.success &&
            questionsResponse.questions &&
            questionsResponse.questions.length > 0
          ) {
            productContext += `\nProduct Questions and Answers:\n`;

            (questionsResponse.questions as Question[])
              .filter((q) => q.question && (q.answer || q.answer === ""))
              .slice(0, 10) // Limit to first 10 answered questions to avoid token limits
              .forEach((q, index) => {
                productContext += `${index + 1}. Q: ${q.question}\n`;
                productContext += `   A: ${q.answer || "Not answered yet"}\n`;
              });
          }
        } catch (error) {
          console.error("Error fetching questions for product context:", error);
        }

        // Add product notes if available
        try {
          const notesResponse = await getProjectNotes(selectedProduct.id);

          if (
            notesResponse.success &&
            notesResponse.notes &&
            notesResponse.notes.length > 0
          ) {
            productContext += `\nProduct Notes:\n`;

            (notesResponse.notes as ProductNote[])
              .slice(0, 5) // Limit to first 5 notes to avoid token limits
              .forEach((note, index) => {
                if (note.note_body) {
                  productContext += `${index + 1}. ${note.note_body.slice(0, 200)}${note.note_body.length > 200 ? "..." : ""}\n`;
                }
              });
          }
        } catch (error) {
          console.error("Error fetching notes for product context:", error);
        }
      }

      // Add the main prompt as first user message
      messages.push({ role: "user", content: userPrompt });

      // Add product context as separate message if available
      if (productContext) {
        messages.push({ role: "user", content: productContext });
      }

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
