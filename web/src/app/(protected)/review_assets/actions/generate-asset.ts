"use server";

import { getProduct } from "@/lib/firebase/products";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { saveAsset, getAsset } from "@/lib/firebase/assets";
import { type Product } from "@/lib/firebase/schema";
import { getAllQuestionAnswers } from "@/lib/firebase/question-answers";
import { getProjectNotes } from "@/lib/firebase/notes";
import { awardXpPoints } from "@/xp/server-actions"; // Import XP award function
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Dynamic import AI utils to avoid bundling them in the client
const generateAIContent = async (params: {
  systemPrompt: string;
  document: string;
  product: Product;
  questionAnswers: Array<{
    id: string;
    question: string;
    answer: string;
    questionId: string;
  }>; // Use QuestionAnswer interface structure
  notes: Array<{
    id: string;
    note_body: string;
    updatedAt: number;
  }>; // Use Note structure
  asset: {
    title: string;
    description: string;
    phase: string;
    systemPrompt: string;
  };
}) => {
  // Import the AI module only on the server
  const { generateAssetContentWithLangGraph } = await import("@/lib/ai");
  return generateAssetContentWithLangGraph(params);
};

async function handleAssetGeneration(data: {
  productId: string;
  assetId: string;
}): Promise<{ success: boolean; content?: string; error?: string }> {
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

    // Get the selected asset from Firestore
    const assetResponse = await getAsset(productId, assetId);
    if (!assetResponse.success || !assetResponse.asset) {
      return {
        success: false,
        error: assetResponse.error || `Asset with ID ${assetId} not found`,
      };
    }
    const asset = assetResponse.asset;

    // Get all question answers for the product
    const answersResponse = await getAllQuestionAnswers(productId);
    if (!answersResponse.success) {
      return {
        success: false,
        error: answersResponse.error || "Failed to get question answers",
      };
    }
    const questionAnswers = answersResponse.answers || [];

    // Get notes for the product
    const notesResponse = await getProjectNotes(productId);
    // Ensure notes have the correct structure with all required fields
    const notes = notesResponse.success
      ? (notesResponse.notes || []).map((note: any) => ({
          id: note.id || "",
          note_body: note.note_body || "",
          updatedAt: note.updatedAt || getCurrentUnixTimestamp(),
        }))
      : [];

    // Generate the content using our AI module with LangGraph
    const generatedContent: string = await generateAIContent({
      systemPrompt: asset.systemPrompt ?? "",
      document: asset.title, // Use title instead of document
      product,
      questionAnswers,
      notes,
      asset: {
        title: asset.title,
        description: asset.description ?? "",
        phase: asset.phase ?? "",
        systemPrompt: asset.systemPrompt ?? "",
      },
    });

    // Award XP for successful generation *before* saving
    try {
      await awardXpPoints("generate_asset", userId);
      console.log(
        `Awarded XP to user ${userId} for generating asset ${assetId}`
      );
    } catch (xpError) {
      console.error("Failed to award XP for generating asset:", xpError);
      // Non-critical, continue
    }

    // Save the generated content to Firestore
    const saveResponse = await saveAsset(productId, {
      id: assetId,
      content: generatedContent,
      updatedAt: getCurrentUnixTimestamp(),
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
    console.error("Failed to generate asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Use a simple server action since we're having issues with safe-action
// This will work with Next.js server actions directly
// export async function generateAsset(
//   data: z.infer<typeof assetGenerationSchema>
// ) {
export async function generateAsset(data: {
  productId: string;
  assetId: string;
}) {
  return handleAssetGeneration(data);
}
