"use server";

import fs from "fs/promises";
import path from "path";

export async function generateEmbedHtml(
  agentId: string,
  agentName: string,
  origin: string
) {
  try {
    // Read the template file
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "agent-embed-template.html"
    );
    const templateContent = await fs.readFile(templatePath, "utf-8");

    // Create the iframe code
    const iframeCode = `<iframe
  src="${origin}/embed/agent/${agentId}?theme=light"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
  title="${agentName} Chat">
</iframe>`;

    // Replace placeholder with the iframe code
    const finalHtml = templateContent.replace(
      "<!-- AGENT_IFRAME_PLACEHOLDER -->",
      iframeCode
    );

    return finalHtml;
  } catch (error) {
    console.error("Error generating embed HTML:", error);
    throw new Error("Failed to generate embed HTML");
  }
}
