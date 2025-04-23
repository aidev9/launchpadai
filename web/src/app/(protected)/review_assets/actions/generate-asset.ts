"use server";

import { z } from "zod";
// Comment out the safe-action import since there's a module resolution issue
// import { action } from "@/lib/safe-action";
import { getProduct } from "@/lib/firebase/products";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { saveAsset } from "@/lib/firebase/assets";
import { type Product } from "@/lib/store/product-store";
import { assets } from "../data/assets";
import {
  getAllQuestionAnswers,
  type QuestionAnswer,
} from "@/lib/firebase/question-answers";
import { generateAssetContentWithLangGraph as generateAIContent } from "@/lib/ai";

// Schema for the input
const assetGenerationSchema = z.object({
  productId: z.string(),
  assetId: z.string(),
});

// Define the action handler
async function handleAssetGeneration(
  data: z.infer<typeof assetGenerationSchema>
): Promise<{ success: boolean; content?: string; error?: string }> {
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

    // Generate the content using our AI module with LangGraph
    const generatedContent: string = await generateAIContent({
      systemPrompt: asset.systemPrompt,
      document: asset.document,
      product,
      questionAnswers,
    });

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
}): Promise<{ success: boolean; content?: string; error?: string }> {
  return handleAssetGeneration(data);
}
