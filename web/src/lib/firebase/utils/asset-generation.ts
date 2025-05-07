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
 * Get a basic outline for an asset type when generation fails
 */
function getBasicOutlineForAssetType(
  assetType: string,
  techStackDetails: any
): string {
  const name = techStackDetails.name || "Tech Stack";

  switch (assetType) {
    case "PRD":
      return `## Product Requirements Document for ${name}
      
### Executive Summary
Brief overview of the product

### Product Goals
- Goal 1
- Goal 2

### User Stories
- As a user, I want to...
- As an admin, I need to...

### Functional Requirements
- Requirement 1
- Requirement 2

### Technical Requirements
- Tech requirement 1
- Tech requirement 2`;

    case "Architecture":
      return `## Architecture Overview for ${name}
      
### System Components
- Frontend: ${techStackDetails.frontEndStack || "React"}
- Backend: ${techStackDetails.backendStack || "Node.js"}
- Database: ${techStackDetails.database || "SQL"}

### Data Flow
Brief description of data flow

### API Design
API endpoints overview`;

    case "Tasks":
      return `## Development Tasks for ${name}
      
### Frontend Tasks
- [ ] Set up project structure
- [ ] Create UI components
- [ ] Implement routing

### Backend Tasks
- [ ] Set up API endpoints
- [ ] Implement authentication
- [ ] Create database models`;

    case "Rules":
      return `## Development Rules for ${name}
      
### Code Style
- Follow consistent formatting
- Use meaningful variable names

### Git Workflow
- Use feature branches
- Require code reviews

### Testing Requirements
- Write unit tests
- Maintain test coverage`;

    case "Prompt":
      return `## AI Prompt for ${name}
      
### System Instructions
You are an AI assistant helping with ${name}

### Project Context
This is a ${techStackDetails.appType || "web application"} using ${techStackDetails.frontEndStack || "React"} and ${techStackDetails.backendStack || "Node.js"}

### Code Generation Guidelines
- Follow project conventions
- Include comments`;

    default:
      return `## Document for ${name}
      
### Overview
Brief overview of the tech stack

### Components
- Frontend: ${techStackDetails.frontEndStack || "React"}
- Backend: ${techStackDetails.backendStack || "Node.js"}
- Database: ${techStackDetails.database || "SQL"}`;
  }
}

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

    // Define the default assets with meaningful placeholder content
    const defaultAssets = [
      {
        title: "Product Requirements Document",
        body: `# ${techStackName} - Product Requirements Document\n\n## Overview\nThis document outlines the requirements for the ${techStackName} project.\n\n## Key Features\n- Feature 1: Description\n- Feature 2: Description\n- Feature 3: Description\n\n## User Stories\n- As a user, I want to...\n- As an admin, I need to...\n\n*Click "Regenerate" to create a complete PRD with AI assistance.*`,
        tags: ["PRD", "requirements"],
        assetType: "PRD" as const,
        techStackId,
        isGenerating: true, // First asset starts generating immediately
        needsGeneration: false, // Will be generated immediately
      },
      {
        title: "Architecture Overview",
        body: `# ${techStackName} - Architecture Overview\n\n## System Architecture\nThis document provides an overview of the ${techStackName} architecture.\n\n## Components\n- Frontend: ${techStackDetails.frontEndStack}\n- Backend: ${techStackDetails.backendStack}\n- Database: ${techStackDetails.database}\n- Deployment: ${techStackDetails.deploymentStack}\n\n## Diagram\n[Architecture diagram placeholder]\n\n*Click "Regenerate" to create a complete architecture document with AI assistance.*`,
        tags: ["architecture", "design"],
        assetType: "Architecture" as const,
        techStackId,
        isGenerating: false,
        needsGeneration: true,
      },
      {
        title: "Development Tasks",
        body: `# ${techStackName} - Development Tasks\n\n## Project Tasks\nThis document outlines the key development tasks for ${techStackName}.\n\n## Frontend Tasks\n- Set up project structure\n- Implement UI components\n- Connect to API\n\n## Backend Tasks\n- Create API endpoints\n- Set up database models\n- Implement authentication\n\n*Click "Regenerate" to create a complete task list with AI assistance.*`,
        tags: ["tasks", "development"],
        assetType: "Tasks" as const,
        techStackId,
        isGenerating: false,
        needsGeneration: true,
      },
      {
        title: "Development Rules",
        body: `# ${techStackName} - Development Rules\n\n## Coding Standards\nThis document outlines the development rules and guidelines for ${techStackName}.\n\n## General Guidelines\n- Follow consistent code formatting\n- Write unit tests for all features\n- Document public APIs\n\n## Review Process\n- Code reviews required for all PRs\n- CI/CD must pass before merging\n\n*Click "Regenerate" to create complete development rules with AI assistance.*`,
        tags: ["rules", "guidelines"],
        assetType: "Rules" as const,
        techStackId,
        isGenerating: false,
        needsGeneration: true,
      },
      {
        title: "AI Prompt",
        body: `# ${techStackName} - AI Prompt\n\n## AI Assistant Context\nThis document provides context for AI assistants working on ${techStackName}.\n\n## Project Description\n${techStackDetails.description || "A new tech stack project"}\n\n## Technology Stack\n- Frontend: ${techStackDetails.frontEndStack}\n- Backend: ${techStackDetails.backendStack}\n- Database: ${techStackDetails.database}\n\n*Click "Regenerate" to create a complete AI prompt with AI assistance.*`,
        tags: ["prompt", "AI"],
        assetType: "Prompt" as const,
        techStackId,
        isGenerating: false,
        needsGeneration: true,
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

    // Start sequential generation process
    // This happens in the background and doesn't block the UI
    (async () => {
      try {
        console.log(
          `[Asset Generation] Starting sequential generation for ${assetRefs.length} assets`
        );

        // Generate assets one by one
        for (let i = 0; i < assetRefs.length; i++) {
          const { id, assetType } = assetRefs[i];
          console.log(
            `[Asset Generation] Processing asset ${i + 1}/${assetRefs.length}: ${assetType} (${id})`
          );

          // Skip updating the first asset since it's already marked as generating
          if (i === 0) {
            console.log(
              `[Asset Generation] Generating first asset: ${assetType}`
            );

            // Generate the first asset
            const result = await generateAssetContent(
              techStackId,
              id,
              assetType,
              techStackDetails,
              undefined
            );

            console.log(
              `[Asset Generation] First asset generation result:`,
              result.success ? "Success" : "Failed"
            );

            // Verify the asset was updated correctly
            const assetDoc = await assetsRef.doc(id).get();
            const assetData = assetDoc.data();
            console.log(
              `[Asset Generation] First asset data after generation:`,
              {
                isGenerating: assetData?.isGenerating,
                needsGeneration: assetData?.needsGeneration,
                recentlyCompleted: assetData?.recentlyCompleted,
              }
            );

            // Small delay between generations for better UX
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            // For subsequent assets, mark as generating first
            console.log(
              `[Asset Generation] Starting generation for asset ${i + 1}: ${assetType}`
            );
            await assetsRef.doc(id).update({
              isGenerating: true,
              needsGeneration: false,
            });

            // Then generate content
            const result = await generateAssetContent(
              techStackId,
              id,
              assetType,
              techStackDetails,
              undefined
            );

            console.log(
              `[Asset Generation] Asset ${i + 1} generation result:`,
              result.success ? "Success" : "Failed"
            );

            // Verify the asset was updated correctly
            const assetDoc = await assetsRef.doc(id).get();
            const assetData = assetDoc.data();
            console.log(
              `[Asset Generation] Asset ${i + 1} data after generation:`,
              {
                isGenerating: assetData?.isGenerating,
                needsGeneration: assetData?.needsGeneration,
                recentlyCompleted: assetData?.recentlyCompleted,
              }
            );

            // Small delay between generations for better UX
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        console.log(
          `[Asset Generation] Completed sequential generation of all assets`
        );
      } catch (error) {
        console.error(
          "[Asset Generation] Error in sequential asset generation:",
          error
        );
      }
    })();

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
  console.log(
    `[generateAssetContent] Starting for asset: ${assetType} (${assetId})`
  );
  try {
    // Get the appropriate prompts for this asset type
    const { systemPrompt } = getAssetPrompt(assetType);
    const userPrompt = generateUserPrompt(
      assetType,
      techStackDetails,
      userInstructions
    );
    console.log(`[generateAssetContent] Got prompts for ${assetType}`);

    // Generate content using the Vercel AI SDK with gpt-4o-mini model
    let contentString;
    let textContent = ""; // Declare textContent outside the try block so it's accessible in the return statement
    try {
      console.log(
        `[generateAssetContent] Starting AI generation for ${assetType}`
      );

      // Create a promise that rejects after a timeout
      const timeout = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error("Content generation timed out after 30 seconds")),
          30000
        );
      });

      // Race the content generation against the timeout
      const generatedContent = await Promise.race([
        generateText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
        }),
        timeout,
      ]);

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

      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes("timed out")) {
        contentString = `# ${assetType} for ${techStackDetails.name}\n\n## Content Generation Timed Out\n\nThe AI model took too long to respond. Here's a basic outline you can use:\n\n${getBasicOutlineForAssetType(assetType, techStackDetails)}\n\nClick "Regenerate" to try again.`;
      } else {
        contentString = `# ${assetType} for ${techStackDetails.name}\n\nContent generation encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try regenerating.`;
      }
    }

    // Update the asset with the generated content
    console.log(
      `[generateAssetContent] Updating asset ${assetId} with generated content`
    );
    const userId = await getCurrentUserId();
    const assetsRef = await getTechStackAssetsRef(userId, techStackId);

    const updateData = {
      body: contentString,
      updatedAt: getCurrentUnixTimestamp(),
      isGenerating: false,
      recentlyCompleted: true,
      completedAt: getCurrentUnixTimestamp(),
      needsGeneration: false,
    };

    console.log(
      `[generateAssetContent] Update data for ${assetId}:`,
      updateData
    );

    await assetsRef.doc(assetId).update(updateData);

    // Verify the update was successful
    const updatedDoc = await assetsRef.doc(assetId).get();
    const updatedData = updatedDoc.data();
    console.log(`[generateAssetContent] Asset ${assetId} after update:`, {
      isGenerating: updatedData?.isGenerating,
      needsGeneration: updatedData?.needsGeneration,
      recentlyCompleted: updatedData?.recentlyCompleted,
    });

    // Set a timeout to clear the recentlyCompleted flag after 5 seconds
    console.log(
      `[generateAssetContent] Setting timeout to clear recentlyCompleted flag for ${assetId} in 5 seconds`
    );
    setTimeout(async () => {
      try {
        console.log(
          `[generateAssetContent] Clearing recentlyCompleted flag for ${assetId}`
        );
        await assetsRef.doc(assetId).update({
          recentlyCompleted: false,
        });

        // Verify the update was successful
        const finalDoc = await assetsRef.doc(assetId).get();
        const finalData = finalDoc.data();
        console.log(
          `[generateAssetContent] Asset ${assetId} after clearing recentlyCompleted:`,
          {
            isGenerating: finalData?.isGenerating,
            needsGeneration: finalData?.needsGeneration,
            recentlyCompleted: finalData?.recentlyCompleted,
          }
        );
      } catch (error) {
        console.error(
          `[generateAssetContent] Error clearing recentlyCompleted flag for ${assetId}:`,
          error
        );
      }
    }, 5000);

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
