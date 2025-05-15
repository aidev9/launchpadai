"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getTechStackAssetsRef } from "./asset-crud";
import { adminDb } from "../admin";
import { getAssetPrompt, generateUserPrompt } from "./asset-prompts";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";

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
 * Generate default set of assets for a tech stack
 */
export async function generateDefaultAssets(
  techStackId: string,
  techStackName: string
) {
  console.log(`[Asset Generation] Starting for tech stack: ${techStackName}`);
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Get reference to assets collection
    const assetsRef = await getTechStackAssetsRef(userId, techStackId);

    // Check if default assets already exist
    const existingAssets = await assetsRef.get();
    if (!existingAssets.empty) {
      console.log(
        `[Asset Generation] Assets already exist for tech stack ${techStackName}`
      );
      return { success: true, message: "Assets already exist" };
    }

    // Create default asset types
    const defaultAssetTypes = [
      "PRD",
      "Architecture",
      "Tasks",
      "Rules",
      "Prompt",
    ];

    // Create asset documents without content first
    for (const assetType of defaultAssetTypes) {
      const id = `${techStackId}-${assetType.toLowerCase()}`;
      const asset = {
        id,
        title: `${assetType} for ${techStackName}`,
        description: `${assetType} document generated for ${techStackName}`,
        body: "", // Will be populated later
        assetType,
        techStackId,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
        isGenerating: false,
        needsGeneration: true,
      };

      console.log(`[Asset Generation] Creating asset: ${assetType}`);
      await assetsRef.doc(id).set(asset);
    }

    // Get the tech stack details for generating content
    let techStackDetails = { name: techStackName };
    try {
      const techStackDoc = await adminDb
        .collection("techstacks")
        .doc(techStackId)
        .get();
      if (techStackDoc.exists) {
        techStackDetails = techStackDoc.data() as any;
      }
    } catch (error) {
      console.error(
        `[Asset Generation] Error fetching tech stack details:`,
        error
      );
    }

    // Start generating content for each asset in a non-blocking way
    // This allows the function to return while generation continues in the background
    console.log(
      `[Asset Generation] Starting sequential generation of assets in background`
    );
    (async () => {
      try {
        // Generate content for each asset sequentially
        for (let i = 0; i < defaultAssetTypes.length; i++) {
          const assetType = defaultAssetTypes[i];
          const id = `${techStackId}-${assetType.toLowerCase()}`;

          // Check prompt credits for each asset
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
            await assetsRef.doc(id).update({
              isGenerating: false,
              needsGeneration: true,
              body: `# ${assetType} for ${techStackDetails.name}\n\nPlaceholder content. Please use the instructions box below and press "Generate" to regenerate this document.`,
            });
            continue;
          }

          // First, mark asset as generating
          await assetsRef.doc(id).update({
            isGenerating: true,
            needsGeneration: false,
          });

          // Check if the asset has been marked as generating correctly
          const assetDoc = await assetsRef.doc(id).get();
          const assetData = assetDoc.data();

          // Generate content for the asset
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

          // Verify the update was successful
          const updatedDoc = await assetsRef.doc(id).get();
          const updatedData = updatedDoc.data();
          console.log(`[Asset Generation] Asset ${i + 1} after update:`, {
            isGenerating: updatedData?.isGenerating,
            needsGeneration: updatedData?.needsGeneration,
            recentlyCompleted: updatedData?.recentlyCompleted,
          });

          // Small delay between generations for better UX
          await new Promise((resolve) => setTimeout(resolve, 500));
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
  // // Get the current user ID
  // const userId = await getCurrentUserId();

  // if (!userId) {
  //   return {
  //     success: false,
  //     error: "User not authenticated",
  //   };
  // }

  // // Check and consume prompt credit
  // const creditResult = await usePromptCredit({ userId });

  // // Type assertion for the credit result
  // const typedResult = creditResult as unknown as {
  //   data: {
  //     success: boolean;
  //     error?: string;
  //     needMoreCredits?: boolean;
  //     remainingCredits?: number;
  //   };
  // };

  // if (!typedResult.data?.success) {
  //   // User doesn't have enough credits
  //   return {
  //     success: false,
  //     error: typedResult.data?.error || "Insufficient prompt credits",
  //     needMoreCredits: typedResult.data?.needMoreCredits || false,
  //   };
  // }

  // Get the appropriate prompts for this asset type

  try {
    const { systemPrompt } = getAssetPrompt(assetType);
    const userPrompt = generateUserPrompt(
      assetType,
      techStackDetails,
      userInstructions
    );
    const result = await generateText({
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
    });

    // Return the enhanced prompt
    return {
      success: true,
      body: result.text,
    };
  } catch (error) {
    console.error(`Failed to generate content for asset ${assetId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
