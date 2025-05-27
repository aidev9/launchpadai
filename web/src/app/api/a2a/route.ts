import { NextRequest, NextResponse } from "next/server";
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  AgentCard,
  SendMessageParams,
  Message,
  ResponseMessagePart,
  SendMessageSuccessResponse,
  GetAgentCardSuccessResponse,
  MessageContext,
} from "./types";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const defaultAgentName = "A2A Gateway Agent";
const defaultAgentDescription =
  "An AI assistant responding via the A2A protocol.";
const defaultSystemPrompt = `You are ${defaultAgentName}, an AI assistant. You are helpful and concise.`;

const agentCard: AgentCard = {
  name: defaultAgentName,
  description: defaultAgentDescription,
  version: "0.1.0",
  logoUrl: "",
  websiteUrl: "",
  provider: {
    name: "Launchpad AI Next.js Backend",
    url: "",
  },
  capabilities: [
    {
      method: "message/send",
      description: "Sends a message to the agent and receives a response.",
      inputSchema: {
        type: "object",
        properties: { message: { type: "object" } },
      },
      outputSchema: {
        type: "object",
        properties: { message: { type: "object" } },
      },
    },
    {
      method: "agent/card",
      description: "Retrieves the agent's capability card.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: {
        type: "object",
        properties: {
          /* AgentCard schema */
        },
      },
    },
  ],
  authentication: {
    type: "none",
    // additional fields based on type
  },
  metadata: {
    // any additional metadata
  },
};

export async function GET(req: NextRequest) {
  console.log("[A2A API] Received GET request for agent card.");
  return NextResponse.json(agentCard);
}

export async function POST(req: NextRequest) {
  let rpcRequest: JsonRpcRequest;
  try {
    rpcRequest = await req.json();
    console.log(
      "[A2A API] Received POST request:",
      JSON.stringify(rpcRequest, null, 2)
    );
  } catch (error) {
    console.error("[A2A API] Error parsing JSON RPC request:", error);
    const errorResponse: JsonRpcError = {
      code: -32700,
      message: "Invalid JSON was received by the server.",
    };
    return NextResponse.json(
      { jsonrpc: "2.0", error: errorResponse, id: null },
      { status: 400 }
    );
  }

  const { jsonrpc, method, params, id } = rpcRequest;

  if (jsonrpc !== "2.0" || !method) {
    const errorResponse: JsonRpcError = {
      code: -32600,
      message: "The JSON sent is not a valid Request object.",
    };
    return NextResponse.json(
      { jsonrpc: "2.0", error: errorResponse, id: id || null },
      { status: 400 }
    );
  }

  const result: any = null;
  let error: JsonRpcError | null = null;

  switch (method) {
    case "message/send":
      const sendMessageParams = params as SendMessageParams;
      if (
        !sendMessageParams ||
        !sendMessageParams.message ||
        !sendMessageParams.message.parts ||
        sendMessageParams.message.parts.length === 0
      ) {
        error = {
          code: -32602,
          message:
            "Invalid parameters for message/send. 'message' with 'parts' is required.",
        };
        break;
      }
      const incomingMessageTextPart = sendMessageParams.message.parts.find(
        (part) => part.kind === "text"
      );
      const incomingMessageText = incomingMessageTextPart?.text || "";
      const incomingContext = sendMessageParams.message.context;

      console.log(
        `[A2A API] Received message/send. Text: "${incomingMessageText}", Context: ${JSON.stringify(incomingContext)}`
      );

      let llmResponseText = "";
      try {
        if (incomingMessageText.trim() === "") {
          llmResponseText = "Received an empty message.";
        } else {
          console.log(
            `[A2A API] Sending to LLM. System Prompt: "${defaultSystemPrompt}"`
          );

          // Create a mock agent for the unified service
          const mockAgent = {
            id: "a2a-gateway",
            userId: "system",
            productId: "system",
            name: defaultAgentName,
            description: defaultAgentDescription,
            systemPrompt: defaultSystemPrompt,
            phases: [],
            tags: [],
            collections: [],
            tools: [],
            mcpEndpoints: [],
            a2aEndpoints: [],
            configuration: {
              url: "",
              apiKey: "",
              rateLimitPerMinute: 60,
              allowedIps: [],
              isEnabled: true,
            },
          };

          // Import the unified agent chat service
          const { AgentChatService } = await import("@/lib/agent-chat-service");

          const result = await AgentChatService.generateSimpleResponse(
            mockAgent,
            incomingMessageText,
            incomingContext,
            1000
          );
          llmResponseText = result;
          console.log(`[A2A API] Received from LLM: "${llmResponseText}"`);
        }

        const responseMessage: Message = {
          messageId: `nextjs-agent-msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          role: "agent",
          kind: "message",
          parts: [
            { kind: "text", text: llmResponseText } as ResponseMessagePart,
          ],
          context: sendMessageParams.message.context,
        };
        const successResponse: SendMessageSuccessResponse = {
          jsonrpc: "2.0",
          id: id || null,
          result: responseMessage,
        };
        return NextResponse.json(successResponse);
      } catch (llmError: any) {
        console.error("[A2A API] Error calling LLM:", llmError);
        llmResponseText =
          "I apologize, but I'm having trouble processing your request right now.";
        const responseMessage: Message = {
          messageId: `nextjs-agent-msg-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          role: "agent",
          kind: "message",
          parts: [
            { kind: "text", text: llmResponseText } as ResponseMessagePart,
          ],
        };
        const errorSuccessResponse: SendMessageSuccessResponse = {
          jsonrpc: "2.0",
          id: id || null,
          result: responseMessage,
        };
        return NextResponse.json(errorSuccessResponse);
      }
      // Unreachable, but satisfies TypeScript if not returning inside try/catch
      break;

    case "agent/card":
      console.log("[A2A API] Received agent/card request.");
      const agentCardResponse: GetAgentCardSuccessResponse = {
        jsonrpc: "2.0",
        id: id || null,
        result: agentCard,
      };
      return NextResponse.json(agentCardResponse);

    default:
      console.warn(`[A2A API] Received unknown method: ${method}`);
      error = {
        code: -32601,
        message: `Method not found: ${method}`,
      };
      break;
  }

  let response: JsonRpcResponse;
  if (error) {
    response = { jsonrpc: "2.0", error, id: id || null };
    return NextResponse.json(response, {
      status: method === "message/send" && error.code === -32602 ? 400 : 500,
    });
  } else {
    // This path should ideally not be reached if all cases return a NextResponse directly
    response = { jsonrpc: "2.0", result, id: id || null };
    return NextResponse.json(response);
  }
}
