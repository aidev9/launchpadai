"use server";

import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { type Product } from "@/lib/store/product-store";
import { type QuestionAnswer } from "@/lib/firebase/question-answers";

/**
 * Interface for asset generation data
 */
export interface AssetGenerationData {
  systemPrompt: string;
  document: string;
  product: Product;
  questionAnswers: QuestionAnswer[];
}

/**
 * Generate asset content using LangChain
 */
export async function generateAssetContent({
  systemPrompt,
  document,
  product,
  questionAnswers,
}: AssetGenerationData): Promise<string> {
  try {
    // Filter out questions that don't have answers
    const answeredQuestions = questionAnswers.filter(
      (qa) => qa.answer && qa.answer.trim() !== ""
    );

    // Use default content if no answered questions
    if (answeredQuestions.length === 0) {
      // Create a simple model for fallback
      const fallbackModel = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.7,
      });

      // Use messages directly instead of ChatPromptTemplate for simplicity
      const systemMessage = {
        role: "system" as const,
        content: `
You are generating a ${document} for a startup with limited information.
Use the provided product details to create a basic document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.`,
      };

      const userMessage = {
        role: "user" as const,
        content: `
Generate a basic ${document} for a product with these details:

Product Name: ${product.name || "Unnamed Product"}
Product Description: ${product.description || "Not provided"}
Problem: ${product.problem || "Not provided"}
Team: ${product.team || "Not provided"}
Website: ${product.website || "Not provided"}
Country: ${product.country || "Not provided"}
Stage: ${product.stage || "Not provided"}

Note: This is a preliminary version as no detailed Q&A information is available yet.`,
      };

      // Invoke the model with messages
      const response = await fallbackModel.invoke([systemMessage, userMessage]);

      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response);
    }

    // Format the question/answers for the model input
    const formattedQAs = answeredQuestions
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    // Create the model
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Create the system prompt including the document-specific prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      [
        "system",
        `
You are generating a ${document} for a startup. 
Use the provided product details and question/answer pairs to create a comprehensive document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.
      `,
      ],
      [
        "user",
        `
Product Name: {product_name}
Product Description: {product_description}
Problem: {product_problem}
Team: {product_team}
Website: {product_website}
Country: {product_country}
Stage: {product_stage}

Here are all the question/answer pairs available for this product:
{question_answers}

Please generate a comprehensive ${document} based on this information.
      `,
      ],
    ]);

    // Create the chain
    const chain = RunnableSequence.from([
      {
        product_name: async () => product.name || "Unnamed Product",
        product_description: async () => product.description || "Not provided",
        product_problem: async () => product.problem || "Not provided",
        product_team: async () => product.team || "Not provided",
        product_website: async () => product.website || "Not provided",
        product_country: async () => product.country || "Not provided",
        product_stage: async () => product.stage || "Not provided",
        question_answers: async () => formattedQAs,
      },
      promptTemplate,
      model,
    ]);

    // Generate the content
    const response = await chain.invoke({});

    // Extract the content
    const generatedContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response);

    return generatedContent;
  } catch (error) {
    console.error("Error in AI content generation:", error);
    throw error;
  }
}
