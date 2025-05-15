"use server";

import { OpenAI } from "openai";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import { adminDb } from "@/lib/firebase/admin";
import { uploadToStorage } from "@/lib/firebase/storage";
import { z } from "zod";
import { userActionClient } from "@/lib/action";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Asset generation schema validation
export const generateAssetSchema = z.object({
  assetType: z.string().min(1),
  prompt: z.string().min(10),
  size: z.string().optional(),
  format: z.string().optional(),
  saveToLibrary: z.boolean().optional(),
  title: z.string().optional(),
});

// Server action for generating assets using AI
export const generateAsset = userActionClient
  .schema(generateAssetSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Get authenticated user
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
        // User doesn't have enough credits
        return {
          success: false,
          error: typedResult.data?.error || "Insufficient prompt credits",
          needMoreCredits: typedResult.data?.needMoreCredits || false,
        };
      }

      const { assetType, prompt, size, format, saveToLibrary, title } =
        parsedInput;

      let result;
      let contentType;
      let filename;

      // Generate different assets based on asset type
      switch (assetType) {
        case "image":
          result = await openai.images.generate({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: (size || "1024x1024") as "1024x1024",
            response_format: "b64_json",
          });
          contentType = "image/png";
          filename = `image_${Date.now()}.png`;
          break;

        case "logo":
          result = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional logo design: ${prompt}`,
            n: 1,
            size: (size || "1024x1024") as "1024x1024",
            response_format: "b64_json",
          });
          contentType = "image/png";
          filename = `logo_${Date.now()}.png`;
          break;

        case "social":
          result = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Social media post: ${prompt}`,
            n: 1,
            size: "1024x1024", // Social media posts often have standard sizes
            response_format: "b64_json",
          });
          contentType = "image/png";
          filename = `social_${Date.now()}.png`;
          break;

        case "marketing":
          // Generate marketing copy using text models
          const marketingResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional marketing copywriter. Create compelling marketing copy based on the user's prompt.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
          });

          result = { text: marketingResponse.choices[0].message.content };
          contentType = "text/plain";
          filename = `marketing_${Date.now()}.txt`;
          break;

        default:
          throw new Error("Invalid asset type");
      }

      // Handle the result and save it if requested
      if (saveToLibrary && result) {
        let assetUrl = "";
        let assetData;

        if (contentType.startsWith("image/")) {
          // Save image to Firebase Storage
          if (!result.data?.[0]?.b64_json) {
            throw new Error("No image data received from OpenAI");
          }

          const base64Data = result.data[0].b64_json;
          const buffer = Buffer.from(base64Data, "base64");

          // Upload to Firebase Storage using the uploadToStorage function
          const storageResult = await uploadToStorage(
            buffer,
            `assets/${userId}/${filename}`,
            contentType
          );

          if (!storageResult.success || !storageResult.url) {
            throw new Error(
              storageResult.error || "Failed to upload to storage"
            );
          }

          assetUrl = storageResult.url;

          // Save metadata to Firestore
          assetData = {
            userId,
            type: assetType,
            title: title || `Generated ${assetType}`,
            prompt,
            url: assetUrl,
            createdAt: getCurrentUnixTimestamp(),
          };
        } else if (contentType === "text/plain" && "text" in result) {
          // Save text directly to Firestore
          assetData = {
            userId,
            type: assetType,
            title: title || `Generated ${assetType}`,
            prompt,
            content: result.text,
            createdAt: getCurrentUnixTimestamp(),
          };
        }

        // Add null check before adding to Firestore
        if (assetData) {
          // Save to Firestore assets collection
          await adminDb.collection("assets").add(assetData);

          // Revalidate the assets library page
          revalidatePath("/assets");
        }
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error("Error generating asset:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  });

// Function to save an asset to the user's library
export const saveAssetToLibrary = userActionClient
  .schema(
    z.object({
      assetType: z.string(),
      title: z.string(),
      data: z.any(),
      prompt: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const { assetType, title, data, prompt } = parsedInput;

      // Create asset document
      const assetData = {
        userId,
        type: assetType,
        title,
        prompt: prompt || "",
        data,
        createdAt: getCurrentUnixTimestamp(),
      };

      // Save to Firestore
      await adminDb.collection("assets").add(assetData);

      // Revalidate the assets library page
      revalidatePath("/assets");

      return { success: true };
    } catch (error) {
      console.error("Error saving asset:", error);
      return { success: false, error: String(error) };
    }
  });
