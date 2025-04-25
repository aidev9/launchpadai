"use server";

import { z } from "zod";
import { action } from "@/lib/safe-action";
import { prompts } from "../data/prompts";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getAsset } from "@/lib/firebase/assets";
import JSZip from "jszip";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { awardXpPoints } from "@/xp/server-actions";

// Schema for download assets parameters
const downloadAssetsSchema = z.object({
  productId: z.string(),
  assetIds: z.array(z.string()),
  promptIds: z.array(z.string()),
});

// Direct server action for downloading assets
export async function downloadAssets(data: {
  productId: string;
  assetIds: string[];
  promptIds: string[];
}) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Create a new zip file
    const zip = new JSZip();
    const zipId = uuidv4();
    const zipFileName = `${zipId}.zip`;
    const zipPath = `/tmp/${zipFileName}`;

    // Add prompts to zip
    if (data.promptIds.length > 0) {
      const guidelines = zip.folder("Guidelines");

      for (const promptId of data.promptIds) {
        const prompt = prompts.find((p) => p.id === promptId);
        if (prompt) {
          guidelines?.file(`${prompt.label}.md`, prompt.md_content);
        }
      }
    }

    // Add assets to zip
    if (data.assetIds.length > 0) {
      const assetsFolder = zip.folder("Assets");

      for (const assetId of data.assetIds) {
        // Fetch from Firebase
        const result = await getAsset(data.productId, assetId);

        if (result.success && result.asset) {
          const asset = result.asset;

          // Use document title or a fallback title
          let documentTitle = asset.document;

          // If document is empty, try other fields that might contain a title
          if (!documentTitle) {
            if (asset.title) {
              documentTitle = asset.title;
            } else if (asset.content) {
              // Try to extract a title from content (first line or first 30 chars)
              const firstLine = asset.content.split("\n")[0]?.trim();
              if (firstLine && firstLine.length < 50) {
                documentTitle = firstLine.replace(/^#\s+/, ""); // Remove Markdown heading
              } else {
                documentTitle = asset.content.substring(0, 30).trim() + "...";
              }
            } else {
              documentTitle = `Document ${assetId.substring(0, 6)}`;
            }
          }

          // Ensure title is safe for filenames by removing invalid characters
          const safeTitleForFilename = documentTitle
            .replace(/[<>:"/\\|?*]/g, "-") // Replace invalid filename characters
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();

          // Generate filename with .md extension
          const fileName = safeTitleForFilename.endsWith(".md")
            ? safeTitleForFilename
            : `${safeTitleForFilename}.md`;

          // Generate content
          const content =
            asset.content ||
            `# ${documentTitle}\n\nNo content available for this document.`;

          assetsFolder?.file(fileName, content);
        } else {
          console.error(`Failed to fetch asset ${assetId}: ${result.error}`);
        }
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    await writeFile(zipPath, zipContent);

    // Award XP based on number of assets downloaded
    const numAssets = data.assetIds.length;
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

    // Return the download URL or path
    return {
      success: true,
      downloadUrl: `/api/download/${zipFileName}`,
      fileName: `launchpad-assets-${new Date().toISOString().split("T")[0]}.zip`,
    };
  } catch (error) {
    console.error("Error downloading assets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
