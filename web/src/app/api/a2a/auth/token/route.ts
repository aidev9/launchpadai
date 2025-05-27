import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grant_type, code, client_id, client_secret, redirect_uri } = body;

    console.log("[A2A OAuth] Token request:", {
      grant_type,
      client_id,
      redirect_uri,
      hasCode: !!code,
      hasClientSecret: !!client_secret,
    });

    // Validate required parameters
    if (!grant_type || !code || !client_id || !client_secret) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description:
            "Missing required parameters: grant_type, code, client_id, client_secret",
        },
        { status: 400 }
      );
    }

    if (grant_type !== "authorization_code") {
      return NextResponse.json(
        {
          error: "unsupported_grant_type",
          error_description:
            "Only 'authorization_code' grant type is supported",
        },
        { status: 400 }
      );
    }

    // Decode and validate the authorization code
    let codeData;
    try {
      const decodedCode = Buffer.from(code, "base64").toString("utf-8");
      codeData = JSON.parse(decodedCode);
    } catch (error) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Invalid authorization code",
        },
        { status: 400 }
      );
    }

    // Validate code expiration
    if (Date.now() > codeData.expiresAt) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Authorization code has expired",
        },
        { status: 400 }
      );
    }

    // Validate client_id matches
    if (codeData.clientId !== client_id) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Client ID mismatch",
        },
        { status: 400 }
      );
    }

    // Validate redirect_uri matches (if provided)
    if (redirect_uri && codeData.redirectUri !== redirect_uri) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Redirect URI mismatch",
        },
        { status: 400 }
      );
    }

    // Find and validate the agent with client credentials
    const agent = await findAgentByCredentials(client_id, client_secret);
    if (!agent) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Invalid client credentials",
        },
        { status: 401 }
      );
    }

    // Generate access token (in production, use a proper JWT library)
    const accessToken = generateAccessToken(agent.id, codeData.scope);

    // Generate refresh token (optional)
    const refreshToken = generateRefreshToken(agent.id);

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600, // 1 hour
      refresh_token: refreshToken,
      scope: codeData.scope,
    });
  } catch (error) {
    console.error("[A2A OAuth] Token error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function findAgentByCredentials(
  clientId: string,
  clientSecret: string
): Promise<any> {
  try {
    const { adminDb } = await import("@/lib/firebase/admin");

    const agentsQuery = adminDb.collectionGroup("myagents");
    const snapshot = await agentsQuery.get();

    for (const doc of snapshot.docs) {
      const agentData = doc.data();
      const agent = { ...agentData, id: doc.id } as any;
      if (
        agent.configuration?.a2aOAuth?.clientId === clientId &&
        agent.configuration?.a2aOAuth?.clientSecret === clientSecret &&
        agent.configuration?.isEnabled
      ) {
        return agent;
      }
    }

    return null;
  } catch (error) {
    console.error("[A2A OAuth] Error finding agent by credentials:", error);
    return null;
  }
}

function generateAccessToken(agentId: string, scope: string): string {
  // In production, use a proper JWT library with signing
  const tokenData = {
    agentId,
    scope,
    type: "access_token",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600 * 1000, // 1 hour
  };

  return Buffer.from(JSON.stringify(tokenData)).toString("base64");
}

function generateRefreshToken(agentId: string): string {
  // In production, use a proper JWT library with signing
  const tokenData = {
    agentId,
    type: "refresh_token",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
  };

  return Buffer.from(JSON.stringify(tokenData)).toString("base64");
}
