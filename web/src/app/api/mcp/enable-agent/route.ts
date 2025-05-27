import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    // Hard-coded agent name (not ID) from the UI
    const agentName = "qwqwqw";

    // Generate a new API key
    const apiKey = generateApiKey();

    console.log(
      `[MCP Enable] Enabling MCP for agent with name: ${agentName} with API key: ${apiKey}`
    );

    // Find the agent across all users using collection group query
    const agentsQuery = adminDb.collectionGroup("myagents");
    const snapshot = await agentsQuery.get();

    // Find the agent with matching name
    const agentDoc = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.name === agentName;
    });

    if (!agentDoc) {
      console.log(`[MCP Enable] Agent not found with name: ${agentName}`);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agentId = agentDoc.id;
    console.log(
      `[MCP Enable] Found agent with ID: ${agentId} and name: ${agentName}`
    );

    // Update the agent document with isEnabled=true and the API key
    await agentDoc.ref.update({
      "configuration.isEnabled": true,
      "configuration.apiKey": apiKey,
    });

    // Return success with the agent details and API key
    return NextResponse.json({
      success: true,
      message: "Agent MCP enabled successfully",
      agentId,
      agentName,
      apiKey,
      mcpEndpoint: `http://localhost:3000/api/mcp/agents/${agentId}`,
      mcpConfig: {
        mcpServers: {
          [agentName]: {
            command: "curl",
            args: [
              "-X",
              "POST",
              `http://localhost:3000/api/mcp/agents/${agentId}`,
              "-H",
              "Content-Type: application/json",
              "-H",
              `x-api-key: ${apiKey}`,
              "-d",
              "@-",
            ],
          },
        },
      },
    });
  } catch (error) {
    console.error("[MCP Enable] Error:", error);
    return NextResponse.json(
      { error: "Failed to enable MCP for agent" },
      { status: 500 }
    );
  }
}

// Helper function to generate a random API key
function generateApiKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
