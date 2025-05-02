"use server";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PROMPT_ENHANCEMENT_SYSTEM_PROMPT } from "@/utils/constants";

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
