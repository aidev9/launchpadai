import { NextRequest, NextResponse } from "next/server";
import { serverAgentsService } from "@/lib/firebase/server/agents";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const responseType = searchParams.get("response_type");
    const scope = searchParams.get("scope");
    const state = searchParams.get("state");

    console.log("[A2A OAuth] Authorization request:", {
      clientId,
      redirectUri,
      responseType,
      scope,
      state,
    });

    // Validate required parameters
    if (!clientId || !redirectUri || !responseType) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description:
            "Missing required parameters: client_id, redirect_uri, response_type",
        },
        { status: 400 }
      );
    }

    if (responseType !== "code") {
      return NextResponse.json(
        {
          error: "unsupported_response_type",
          error_description: "Only 'code' response type is supported",
        },
        { status: 400 }
      );
    }

    // Find agent by client_id
    const agent = await findAgentByClientId(clientId);
    if (!agent) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Invalid client_id",
        },
        { status: 400 }
      );
    }

    // Generate authorization code (in production, this should be more secure)
    const authCode = generateAuthorizationCode(clientId, redirectUri);

    // Store the authorization code temporarily (in production, use Redis or database)
    // For now, we'll encode the necessary info in the code itself
    const encodedCode = Buffer.from(
      JSON.stringify({
        clientId,
        agentId: agent.id,
        redirectUri,
        scope: scope || "agent.chat agent.read",
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      })
    ).toString("base64");

    // Redirect back to the client with the authorization code
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("code", encodedCode);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[A2A OAuth] Authorization error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function findAgentByClientId(clientId: string): Promise<any> {
  try {
    // This is a simplified implementation using collection group query
    // In production, you'd want to index agents by client_id for better performance
    const { adminDb } = await import("@/lib/firebase/admin");

    const agentsQuery = adminDb.collectionGroup("myagents");
    const snapshot = await agentsQuery.get();

    for (const doc of snapshot.docs) {
      const agentData = doc.data();
      const agent = { ...agentData, id: doc.id } as any;
      if (
        agent.configuration?.a2aOAuth?.clientId === clientId &&
        agent.configuration?.isEnabled
      ) {
        return agent;
      }
    }

    return null;
  } catch (error) {
    console.error("[A2A OAuth] Error finding agent by client_id:", error);
    return null;
  }
}

function generateAuthorizationCode(
  clientId: string,
  redirectUri: string
): string {
  // In production, use a cryptographically secure random generator
  return `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
