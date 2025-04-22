"use server";

import { z } from "zod";
// Comment out the safe-action import since there's a module resolution issue
// import { action } from "@/lib/safe-action";
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getProduct } from "@/lib/firebase/products";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { saveAsset } from "@/lib/firebase/assets";
import { type Product } from "@/lib/store/product-store";
import { assets } from "../data/assets";

// Interface for question answers to fix import error
interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  questionId: string;
}

// Function to get question answers
async function getAllQuestionAnswers(productId: string): Promise<{
  success: boolean;
  answers: QuestionAnswer[];
  error?: string;
}> {
  // This is a placeholder. In a real implementation, this would fetch from Firebase
  // For now, return a mock success response with empty answers
  try {
    return {
      success: true,
      answers: [] as QuestionAnswer[],
    };
  } catch (error) {
    return {
      success: false,
      answers: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Schema for the input
const assetGenerationSchema = z.object({
  productId: z.string(),
  assetId: z.string(),
});

// Define the action handler
async function generateAssetContent(
  data: z.infer<typeof assetGenerationSchema>
) {
  try {
    const { productId, assetId } = data;

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get the product details
    const productResponse = await getProduct(productId);
    if (!productResponse.success || !productResponse.product) {
      return {
        success: false,
        error: productResponse.error || "Failed to get product details",
      };
    }
    const product = productResponse.product as Product;

    // Get the selected asset
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) {
      return {
        success: false,
        error: `Asset with ID ${assetId} not found`,
      };
    }

    // Get all question answers for the product
    const answersResponse = await getAllQuestionAnswers(productId);
    if (!answersResponse.success) {
      return {
        success: false,
        error: answersResponse.error || "Failed to get question answers",
      };
    }
    const questionAnswers = answersResponse.answers || [];

    // Create the LangGraph model
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Create the system prompt including the document-specific prompt
    const systemPrompt = ChatPromptTemplate.fromMessages([
      ["system", asset.systemPrompt],
      [
        "system",
        `
You are generating a ${asset.document} for a startup. 
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

Please generate a comprehensive ${asset.document} based on this information.
      `,
      ],
    ]);

    // Generate content without using StateGraph for simplicity
    // Format the question/answers for the model input
    const formattedQAs = questionAnswers
      .map(
        (qa: QuestionAnswer) =>
          `Q: ${qa.question}\nA: ${qa.answer || "Not answered yet"}`
      )
      .join("\n\n");

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
      systemPrompt,
      model,
    ]);

    // Generate the content
    const response = await chain.invoke({});

    // Extract the content
    const generatedContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response);

    // Save the generated content to Firestore
    const saveResponse = await saveAsset(productId, {
      id: assetId,
      phase: asset.phase,
      document: asset.document,
      systemPrompt: asset.systemPrompt,
      order: asset.order,
      content: generatedContent,
    });

    if (!saveResponse.success) {
      return {
        success: false,
        error: saveResponse.error || "Failed to save generated content",
      };
    }

    return {
      success: true,
      content: generatedContent,
    };
  } catch (error) {
    console.error("Error generating asset content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Use a simple server action since we're having issues with safe-action
// This will work with Next.js server actions directly
export async function generateAsset(data: {
  productId: string;
  assetId: string;
}) {
  return generateAssetContent(data);
}
