"use server";

import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getTechStackAssets } from "@/lib/firebase/techstack-assets";
import JSZip from "jszip";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { awardXpPoints } from "@/xp/server-actions";

/**
 * Server action to download all assets for a tech stack as a ZIP file
 */
export async function downloadTechStackAssets(techStackId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all assets for the tech stack
    const assetsResult = await getTechStackAssets(techStackId);
    if (!assetsResult.success || !assetsResult.assets) {
      return {
        success: false,
        error: assetsResult.error || "Failed to fetch tech stack assets",
      };
    }

    // Create a new zip file
    const zip = new JSZip();
    const zipId = uuidv4();
    const zipFileName = `${zipId}.zip`;
    const zipPath = `/tmp/${zipFileName}`;

    // Add assets to zip
    if (assetsResult.assets.length > 0) {
      for (const asset of assetsResult.assets) {
        // Ensure title is safe for filenames by removing invalid characters
        const safeTitleForFilename = asset.title
          .replace(/[<>:"/\\|?*]/g, "-") // Replace invalid filename characters
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();

        // Generate filename with .md extension
        const fileName = safeTitleForFilename.endsWith(".md")
          ? safeTitleForFilename
          : `${safeTitleForFilename}.md`;

        // Extract text content from JSON if needed
        const extractTextContent = (content: string): string => {
          // If content is empty or not a string, return as is
          if (!content || typeof content !== "string") {
            return content || "";
          }

          // Check if content looks like JSON (starts with '{' and contains '"text"')
          const trimmedContent = content.trim();
          if (
            trimmedContent.startsWith("{") &&
            trimmedContent.includes('"text"')
          ) {
            try {
              const parsed = JSON.parse(trimmedContent);
              if (parsed && parsed.text) {
                return parsed.text;
              }
            } catch (e) {
              console.error("Error parsing JSON content:", e);
              // If JSON parsing fails, continue to return the original content
            }
          }

          // Return the content as is if it's not JSON or doesn't have a text field
          return content;
        };

        // Process the content to extract text if it's in JSON format
        const processedContent = extractTextContent(asset.body);

        // Add file to zip
        zip.file(fileName, processedContent);
      }
    } else {
      return { success: false, error: "No assets found for this tech stack" };
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    await writeFile(zipPath, zipContent);

    // Award XP based on number of assets downloaded
    const numAssets = assetsResult.assets.length;
    if (numAssets > 0) {
      const actionId =
        numAssets === 1 ? "download_asset" : "download_multiple_assets";
      try {
        await awardXpPoints(actionId, userId);
        console.log(
          `Awarded XP to user ${userId} for downloading ${numAssets} asset(s)`
        );
      } catch (xpError) {
        console.error("Failed to award XP for downloading assets:", xpError);
        // Non-critical, continue
      }
    }

    // Return the download URL
    return {
      success: true,
      downloadUrl: `/api/download/${zipFileName}`,
      fileName: `techstack-assets-${new Date().toISOString().split("T")[0]}.zip`,
    };
  } catch (error) {
    console.error("Error downloading tech stack assets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
