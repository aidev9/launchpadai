"use server";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// OpenAI model configuration
const MODEL_CONFIG = {
  standard: {
    modelName: "gpt-4o-mini",
    temperature: 0.7,
  },
};

/**
 * Enhance a prompt using LangChain
 * @param promptText - The prompt text to enhance
 * @returns The enhanced prompt text
 */
export async function enhancePromptWithLangChain(
  promptText: string
): Promise<string> {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("User not authenticated");
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
      throw new Error(typedResult.data?.error || "Insufficient prompt credits");
    }

    // Create the model using the standard config
    const model = new ChatOpenAI(MODEL_CONFIG.standard);

    // Create the prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", PROMPT_ENHANCEMENT_SYSTEM_PROMPT],
      [
        "user",
        "Please enhance the following prompt to make it more effective for AI tools:\n\n{promptText}",
      ],
    ]);

    // Create the chain
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    // Generate the enhanced prompt
    const enhancedPrompt = await chain.invoke({
      promptText,
    });

    return enhancedPrompt;
  } catch (error) {
    console.error("Error enhancing prompt with LangChain:", error);
    throw error;
  }
}
