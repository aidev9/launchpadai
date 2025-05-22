"use server";

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { getProduct } from "@/lib/firebase/products";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getProjectNotes } from "@/lib/firebase/notes";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import {
  Feature,
  Product,
  Question,
  ProductQuestion,
  Note,
} from "../firebase/schema";

/**
 * Get all questions for a product
 */
async function getProductQuestions(productId: string): Promise<{
  success: boolean;
  questions?: ProductQuestion[];
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = adminDb
      .collection("questions")
      .doc(userId)
      .collection("products")
      .doc(productId)
      .collection("questions");

    const snapshot = await questionsRef.orderBy("updatedAt", "desc").get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductQuestion[];

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error("Failed to fetch product questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Schema for PRD enhancement validation
 */
const enhancePrdSchema = z.object({
  featureId: z.string().min(1, "Feature ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  currentPrd: z.string().min(1, "Current PRD is required"),
  instructions: z.string().optional(),
});

/**
 * Generate a PRD for a feature
 */
export async function generatePrd(feature: Feature) {
  try {
    if (!feature || !feature.productId) {
      return {
        success: false,
        error: "Feature or product ID is missing",
      };
    }

    // Fetch additional product context
    const productResult = await getProduct(feature.productId);
    const product = productResult.success ? productResult.product : null;

    // Fetch product questions
    const questionsResult = await getProductQuestions(feature.productId);
    const questions = questionsResult.success ? questionsResult.questions : [];

    // Fetch product notes
    const notesResult = await getProjectNotes(feature.productId);
    const notes = notesResult.success ? notesResult.notes : [];

    // Current date in YYYY-MM-DD format
    const date = new Date().toISOString().split("T")[0];

    // Extract relevant product information
    const productInfo = product
      ? {
          name: (product as Product).name,
          description: (product as Product).description || "",
          stage: (product as Product).phases[0] || "",
          problem: (product as Product).problem || "",
        }
      : { name: "Unknown Product", description: "", stage: "", problem: "" };

    // Extract relevant questions and answers
    const relevantQA = questions
      ? questions
          .filter((q: ProductQuestion) => q.answer) // Only include answered questions
          .map((q: ProductQuestion) => `**${q.question}**\n${q.answer}`)
      : [];

    // Extract relevant notes
    const relevantNotes = notes
      ? (notes as any[]).map((note: any) => note.note_body).filter(Boolean)
      : [];

    // Generate PRD content
    const prdContent = `# ${feature.name} - Product Requirements Document
  
## Overview

**Date:** ${date}
**Status:** ${feature.status}
**Product:** ${productInfo.name}

## Summary

${feature.description}

${productInfo.description ? `\n### Product Context\n\n${productInfo.description}\n` : ""}
${productInfo.problem ? `\n### Problem Statement\n\n${productInfo.problem}\n` : ""}

## Feature Details

${feature.tags.length > 0 ? `**Tags:** ${feature.tags.join(", ")}\n` : ""}
${productInfo.stage ? `**Current Product Stage:** ${productInfo.stage}\n` : ""}

## Requirements

- TBD

## User Stories

- As a user, I want to...
- As an administrator, I need to...

## Acceptance Criteria

- TBD

## Technical Considerations

- TBD

${relevantQA.length > 0 ? `\n## Related Questions & Answers\n\n${relevantQA.join("\n\n")}\n` : ""}
${relevantNotes.length > 0 ? `\n## Related Notes\n\n${relevantNotes.join("\n\n")}\n` : ""}

## Timeline

- Planning: TBD
- Development: TBD
- Testing: TBD
- Release: TBD
`;

    return {
      success: true,
      prdContent,
    };
  } catch (error) {
    console.error("Failed to generate PRD:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Enhance a PRD using AI
 */
export async function enhancePrd(formData: FormData) {
  try {
    const featureId = formData.get("featureId") as string;
    const productId = formData.get("productId") as string;
    const currentPrd = formData.get("currentPrd") as string;
    const instructions = formData.get("instructions") as string;

    // Validate input
    const validatedData = enhancePrdSchema.parse({
      featureId,
      productId,
      currentPrd,
      instructions,
    });

    // Get user ID for prompt credits
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
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
        error: typedResult.data?.error || "Insufficient prompt credits",
        needMoreCredits: typedResult.data?.needMoreCredits,
      };
    }

    // Fetch additional product context
    const productResult = await getProduct(productId);
    const product = productResult.success ? productResult.product : null;

    // Fetch product questions
    const questionsResult = await getProductQuestions(productId);
    const questions = questionsResult.success ? questionsResult.questions : [];

    // Fetch product notes
    const notesResult = await getProjectNotes(productId);
    const notes = notesResult.success ? notesResult.notes : [];

    // Initialize OpenAI client
    const openai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create system prompt
    const systemPrompt = `You are an expert product requirements document (PRD) writer. 
    Your task is to enhance and improve the provided PRD content.
    Make the PRD more comprehensive, clear, and professional.
    Ensure it follows best practices for PRD structure and content.
    Maintain the original intent and core requirements while improving the presentation and clarity.
    
    Incorporate relevant information from the product context, questions, and notes provided, but do not overwhelm the PRD with generic information.
    Use the product context mainly in the summary section and when making specific suggestions.`;

    // Format product context
    let productContext = "";
    if (product) {
      productContext = `
      Product Name: ${(product as Product).name}
      Product Description: ${(product as Product).description || "N/A"}
      Product Stage: ${(product as Product).phases[0] || "N/A"}
      Product Problem: ${(product as Product).problem || "N/A"}
      `;
    }

    // Format questions and answers
    const questionsContext = questions
      ? questions
          .filter((q: ProductQuestion) => q.answer) // Only include answered questions
          .map(
            (q: ProductQuestion) =>
              `Question: ${q.question}\nAnswer: ${q.answer}`
          )
          .join("\n\n")
      : "";

    // Format notes
    const notesContext = notes
      ? (notes as any[])
          .map(
            (note: any, index: number) => `Note ${index + 1}: ${note.note_body}`
          )
          .join("\n\n")
      : "";

    // Create user prompt
    const userPrompt = `Here is the current PRD content:
    
    ${validatedData.currentPrd}
    
    ${validatedData.instructions ? `Additional instructions: ${validatedData.instructions}` : ""}
    
    Here is additional context about the product:
    
    ${productContext}
    
    ${questionsContext ? `Here are relevant questions and answers about the product:\n\n${questionsContext}` : ""}
    
    ${notesContext ? `Here are relevant notes about the product:\n\n${notesContext}` : ""}
    
    Please enhance this PRD while maintaining its original intent and core requirements. Incorporate relevant information from the product context, questions, and notes, but do not overwhelm the PRD with generic information. Use the product context mainly in the summary section and when making specific suggestions.`;

    // Call OpenAI API using LangChain
    const response = await openai.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Return the enhanced PRD
    return {
      success: true,
      enhancedPrd:
        typeof response.content === "string"
          ? response.content
          : Array.isArray(response.content)
            ? response.content
                .map((item) =>
                  typeof item === "string" ? item : JSON.stringify(item)
                )
                .join("")
            : JSON.stringify(response.content),
    };
  } catch (error) {
    console.error("Failed to enhance PRD:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
