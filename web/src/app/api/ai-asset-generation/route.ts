import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import { getProduct } from "@/lib/firebase/products";
import { getAsset } from "@/lib/firebase/assets";
import { getAllQuestionAnswers } from "@/lib/firebase/question-answers";
import { getProjectNotes } from "@/lib/firebase/notes";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { formatProductDetails, createUnifiedSystemPrompt } from "@/lib/ai";
import { Product } from "@/lib/firebase/schema";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Extract the request data
    const { productId, assetId } = await req.json();

    if (!productId || !assetId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: productId and assetId",
        }),
        { status: 400 }
      );
    }

    // Ensure the API key is available
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is missing. Set it in your .env.local file.",
        }),
        { status: 500 }
      );
    }

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User not authenticated",
        }),
        { status: 401 }
      );
    }

    // Check and consume prompt credit
    const creditResult = await consumePromptCredit({ userId });
    const typedResult = creditResult as unknown as {
      data: {
        success: boolean;
        error?: string;
        needMoreCredits?: boolean;
        remainingCredits?: number;
      };
    };

    if (!typedResult.data?.success) {
      return new Response(
        JSON.stringify({
          error: typedResult.data?.error || "Insufficient prompt credits",
          needMoreCredits: typedResult.data?.needMoreCredits || false,
        }),
        { status: 402 } // 402 Payment Required
      );
    }

    // Get product details
    const productResponse = await getProduct(productId);
    if (!productResponse.success || !productResponse.product) {
      return new Response(
        JSON.stringify({
          error: productResponse.error || "Failed to get product details",
        }),
        { status: 404 }
      );
    }
    const product = productResponse.product;

    // Get the selected asset
    const assetResponse = await getAsset(productId, assetId);
    if (!assetResponse.success || !assetResponse.asset) {
      return new Response(
        JSON.stringify({
          error: assetResponse.error || `Asset with ID ${assetId} not found`,
        }),
        { status: 404 }
      );
    }
    const asset = assetResponse.asset;

    // Get all question answers
    const answersResponse = await getAllQuestionAnswers(productId);
    if (!answersResponse.success) {
      return new Response(
        JSON.stringify({
          error: answersResponse.error || "Failed to get question answers",
        }),
        { status: 500 }
      );
    }
    const questionAnswers = answersResponse.answers || [];

    // Format Q&A pairs
    const formattedQAs =
      questionAnswers.length > 0
        ? questionAnswers
            .filter((qa) => qa.answer && qa.answer.trim() !== "")
            .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join("\n\n")
        : "";

    // Get notes for the product
    const notesResponse = await getProjectNotes(productId);
    const notes = notesResponse.success
      ? (notesResponse.notes || []).map((note: any) => ({
          id: note.id || "",
          note_body: note.note_body || "",
          updatedAt: note.updatedAt || getCurrentUnixTimestamp(),
        }))
      : [];

    // Format notes
    const formattedNotes =
      notes.length > 0
        ? notes.map((note) => `Note: ${note.note_body}`).join("\n\n")
        : "";

    // Create system prompt
    const systemPrompt = asset.systemPrompt ?? "";
    const document = asset.title;

    const unifiedSystemPrompt = await createUnifiedSystemPrompt(
      systemPrompt,
      document,
      {
        title: asset.title,
        description: asset.description ?? "",
        phase: asset.phase ?? "",
        systemPrompt,
      }
    );

    // Create user message
    const userMessage = `
Please generate a comprehensive ${document} based on the following information:

${await formatProductDetails(product as Product)}

${notes.length > 0 ? "\nProject Notes (these take precedence):\n" + formattedNotes : ""}

${questionAnswers.length > 0 ? "\nQuestion & Answer Pairs:\n" + formattedQAs : ""}

Requirements:
1. The document must be at least 2000 words long
2. Include clear sections with headings
3. Provide actionable insights and recommendations
4. Use professional language and formatting
5. Focus on practical implementation details`;

    // Use streamText for streaming response
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: unifiedSystemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Return the result as a stream using toDataStreamResponse, same as naming assistant
    return result.toDataStreamResponse({
      headers: {
        "X-Credits-Updated": "true",
        "X-Asset-Id": assetId,
        "X-Product-Id": productId,
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Error processing your request" }),
      { status: 500 }
    );
  }
}
