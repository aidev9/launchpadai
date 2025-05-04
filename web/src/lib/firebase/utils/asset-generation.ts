"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getTechStack } from "../techstacks";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getTechStackAssetsRef } from "./asset-crud";
import { adminDb } from "../admin";
import {
  getAssetPrompt,
  formatTechStackDetails,
  generateUserPrompt,
} from "./asset-prompts";

/**
 * Generate default assets for a tech stack
 */
export async function generateDefaultAssets(
  techStackId: string,
  techStackName: string
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = await getTechStackAssetsRef(userId, techStackId);

    // Get the tech stack details for AI content generation
    const techStackResult = await getTechStack(techStackId);
    if (!techStackResult.success || !techStackResult.techStack) {
      throw new Error(
        techStackResult.error || "Failed to fetch tech stack details"
      );
    }

    const techStackDetails = techStackResult.techStack;

    // Define the default assets with loading indicators
    const defaultAssets = [
      {
        title: "Product Requirements Document",
        body: `# ${techStackName} - Product Requirements Document\n\n_Content is being generated. This may take a minute..._\n\n![Loading](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)`,
        tags: ["PRD", "requirements"],
        assetType: "PRD" as const,
        techStackId,
        isGenerating: true,
      },
      {
        title: "Architecture Overview",
        body: `# ${techStackName} - Architecture Overview\n\n_Content is being generated. This may take a minute..._\n\n![Loading](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)`,
        tags: ["architecture", "design"],
        assetType: "Architecture" as const,
        techStackId,
        isGenerating: true,
      },
      {
        title: "Development Tasks",
        body: `# ${techStackName} - Development Tasks\n\n_Content is being generated. This may take a minute..._\n\n![Loading](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)`,
        tags: ["tasks", "development"],
        assetType: "Tasks" as const,
        techStackId,
        isGenerating: true,
      },
      {
        title: "Development Rules",
        body: `# ${techStackName} - Development Rules\n\n_Content is being generated. This may take a minute..._\n\n![Loading](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)`,
        tags: ["rules", "guidelines"],
        assetType: "Rules" as const,
        techStackId,
        isGenerating: true,
      },
      {
        title: "AI Prompt",
        body: `# ${techStackName} - AI Prompt\n\n_Content is being generated. This may take a minute..._\n\n![Loading](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)`,
        tags: ["prompt", "AI"],
        assetType: "Prompt" as const,
        techStackId,
        isGenerating: true,
      },
    ];

    // Create a batch write
    const batch = adminDb.batch();
    const now = getCurrentUnixTimestamp();
    const assetRefs: { id: string; assetType: string }[] = [];

    // Add each asset to the batch
    for (const asset of defaultAssets) {
      const assetRef = assetsRef.doc();
      batch.set(assetRef, {
        ...asset,
        createdAt: now,
        updatedAt: now,
      });

      // Store the asset ID and type for content generation
      assetRefs.push({
        id: assetRef.id,
        assetType: asset.assetType,
      });
    }

    // Commit the batch
    await batch.commit();

    // Generate content for each asset in parallel
    const contentGenerationPromises = assetRefs.map(({ id, assetType }) =>
      generateAssetContent(
        techStackId,
        id,
        assetType,
        techStackDetails,
        undefined
      )
    );

    // Wait for all content generation to complete
    await Promise.all(contentGenerationPromises);

    // Note: Removed revalidatePath call to avoid rendering errors
    // The UI will handle updates through direct state management

    return {
      success: true,
      message: "Default assets generated successfully",
    };
  } catch (error) {
    console.error(
      `Failed to generate default assets for tech stack ${techStackId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate asset content with AI
 */
export async function generateAssetContent(
  techStackId: string,
  assetId: string,
  assetType: string,
  techStackDetails: any,
  userInstructions?: string
) {
  try {
    // Get the appropriate prompts for this asset type
    const { systemPrompt } = getAssetPrompt(assetType);
    const userPrompt = generateUserPrompt(
      assetType,
      techStackDetails,
      userInstructions
    );

    // Generate content using the Vercel AI SDK with gpt-4o-mini model
    let contentString;
    let textContent = ""; // Declare textContent outside the try block so it's accessible in the return statement
    try {
      const generatedContent = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Convert the AI result to a plain string
      if (typeof generatedContent === "object") {
        // If it's already an object, stringify it to avoid serialization issues
        textContent = JSON.stringify(generatedContent);
      } else {
        // If it's a string, use it directly
        textContent = String(generatedContent);
      }

      // If it's still an object after stringification (which shouldn't happen),
      // create a fallback string
      if (textContent === "[object Object]") {
        textContent = `# ${assetType} for ${techStackDetails.name}\n\nContent generation encountered an issue. Please try regenerating.`;
      }

      // Store the text content directly
      contentString = textContent;
    } catch (error) {
      console.error("Error in content generation:", error);
      contentString = `# ${assetType} for ${techStackDetails.name}\n\nContent generation encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try regenerating.`;
    }

    // Update the asset with the generated content
    const userId = await getCurrentUserId();
    const assetsRef = await getTechStackAssetsRef(userId, techStackId);

    await assetsRef.doc(assetId).update({
      body: contentString,
      updatedAt: getCurrentUnixTimestamp(),
      isGenerating: false,
    });

    // Note: Removed revalidatePath call to avoid rendering errors
    // The UI will handle updates through direct state management

    return {
      success: true,
      content: contentString,
      assetId,
      assetType,
      body: contentString, // Add body property for direct use in UI
    };
  } catch (error) {
    console.error(`Failed to generate content for asset ${assetId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
