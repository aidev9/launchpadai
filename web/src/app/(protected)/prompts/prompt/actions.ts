"use server";

import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";
import { Message } from "ai";
import { Product, ProductNote, AIModelSettings } from "@/lib/firebase/schema";
import { getOrderedProductQuestions } from "@/lib/firebase/actions/questions";
import { getProjectNotes } from "@/lib/firebase/notes";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";

// Define Question type to match what's returned from getOrderedProductQuestions
interface Question {
  id: string;
  question: string;
  answer?: string;
  order?: number;
}

// Default settings if not provided
const defaultSettings: AIModelSettings = {
  modelId: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};

/**
 * Server action to enhance a prompt with AI
 * @param promptText The prompt to enhance
 * @param instructions Optional instructions for how to enhance the prompt
 * @param settings Optional AI model settings
 * @param selectedProduct Optional product context to include in enhancement
 * @param isStreamingEnabled Whether to return a streaming response or wait for the complete response
 * @returns An object with the enhanced prompt or a stream
 */
export async function enhancePromptStream(
  promptText: string,
  instructions?: string,
  settings?: Partial<AIModelSettings>,
  selectedProduct?: Product | null,
  isStreamingEnabled: boolean = false
) {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        enhancedPrompt: null,
        error: "User not authenticated",
      };
    }

    // Check and consume prompt credit
    const creditResult = await consumePromptCredit({ userId });

    // Type assertion for the credit result
    const typedResult = creditResult as unknown as {
      data: {
        success: boolean;
        error?: string;
        needMoreCredits?: boolean;
        remainingCredits?: number;
      };
    };

    if (!typedResult.data?.success) {
      return {
        success: false,
        enhancedPrompt: null,
        error: typedResult.data?.error || "Insufficient prompt credits",
        needMoreCredits: typedResult.data?.needMoreCredits || false,
      };
    }

    // Merge default settings with provided settings
    const finalSettings: AIModelSettings = {
      ...defaultSettings,
      ...settings,
    };

    // Prepare the prompt context
    let contextualInformation = "";

    // If we have a selected product, gather its information
    if (selectedProduct && selectedProduct.id) {
      // Get answered questions for this product
      const questionsResult = await getOrderedProductQuestions(
        selectedProduct.id
      );
      const questionAnswers: string[] = [];

      if (questionsResult.success && questionsResult.questions) {
        const questions = questionsResult.questions as Question[];
        for (const q of questions) {
          if (q.answer) {
            questionAnswers.push(`${q.question}: ${q.answer}`);
          }
        }
      }

      // Get any project notes
      const notesResult = await getProjectNotes(selectedProduct.id);
      const noteTexts: string[] = [];

      if (notesResult.success && notesResult.notes) {
        // Type assertion for notes
        const notes = notesResult.notes as ProductNote[];
        noteTexts.push(...notes.map((note) => note.note_body));
      }

      // Build contextual information
      contextualInformation = `
Product Information:
Name: ${selectedProduct.name}
Description: ${selectedProduct.description || "No description provided"}

${questionAnswers.length > 0 ? "Questions & Answers:\n" + questionAnswers.join("\n\n") : ""}

${noteTexts.length > 0 ? "Project Notes:\n" + noteTexts.join("\n\n") : ""}
`;
    }

    // Customize the instructions based on what was provided
    const enhancementInstructions = instructions
      ? instructions
      : "Enhance this prompt to be more effective, specific, and likely to produce good results with AI tools.";

    // Set up the messages for the AI
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

${contextualInformation ? "Here is some context about the project:\n\n" + contextualInformation + "\n\n" : ""}

PROMPT TO ENHANCE:
${promptText}`,
      },
    ];

    try {
      if (isStreamingEnabled) {
        // For streaming mode, we use a different approach
        // Instead of returning a complex stream object directly (which causes serialization issues),
        // we return a flag indicating streaming should be used
        // The client will make a separate fetch request to our streaming API route

        return {
          success: true,
          isStreaming: true,
          // No need to include the actual stream which would cause serialization issues
        };
      } else {
        // Generate text using non-streaming approach
        const result = await generateText({
          model: openai(finalSettings.modelId),
          messages,
          temperature: finalSettings.temperature,
          maxTokens: finalSettings.maxTokens,
          topP: finalSettings.topP,
        });

        // Return the enhanced prompt
        return {
          success: true,
          enhancedPrompt: result.text,
        };
      }
    } catch (err) {
      console.error("Error in text generation:", err);
      return {
        success: false,
        enhancedPrompt: null,
        error: String(err),
      };
    }
  } catch (error) {
    console.error("Error in enhancePromptStream:", error);
    return {
      success: false,
      enhancedPrompt: null,
      error: String(error),
    };
  }
}
