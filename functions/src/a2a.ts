import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

// Based on the A2A JSON Schema
interface AgentCapability {
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  streaming?: boolean;
}

interface AgentProvider {
  organization: string;
  url: string;
}

interface AgentSkill {
  id: string;
  name: string;
  description: string;
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  tags: string[];
}

interface AgentCard {
  version: string;
  name: string;
  description: string;
  url: string;
  capabilities: AgentCapability;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  provider?: AgentProvider;
  documentationUrl?: string;
  security?: any[]; // Simplified for now
  securitySchemes?: any; // Simplified for now
  supportsAuthenticatedExtendedCard?: boolean;
}

interface Part {
  kind: "text" | "file" | "data";
  // Based on kind, other properties will exist e.g. text, file, data
  text?: string;
  file?: any; // Placeholder for FilePart
  data?: any; // Placeholder for DataPart
}

interface Message {
  messageId: string;
  role: "user" | "agent";
  parts: Part[];
  kind: "message";
  contextId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
  referenceTaskIds?: string[];
}

interface MessageSendConfiguration {
  acceptedOutputModes: string[];
  blocking?: boolean;
  historyLength?: number;
  // pushNotificationConfig?: PushNotificationConfig; // Simplified for now
}

interface MessageSendParams {
  message: Message;
  configuration?: MessageSendConfiguration;
  metadata?: Record<string, any>;
}

interface SendMessageRequest {
  jsonrpc: "2.0";
  method: "message/send";
  id?: string | number;
  params: MessageSendParams;
}

interface Task {
  taskId: string;
  status: string; // e.g., PENDING, RUNNING, COMPLETED, FAILED, CANCELED
  // other task properties
}

interface SendMessageSuccessResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result: Task | Message; // Can be a Task or a new Message
}

interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

interface JSONRPCErrorResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  error: JSONRPCError;
}

// --- Agent Configuration ---
// This would typically come from a database or configuration file
const MY_AGENT_CARD: AgentCard = {
  version: "1.0.0",
  name: "My Launchpad Agent",
  description: "An agent integrated with Launchpad, capable of various tasks.",
  // Updated placeholder URL for an onRequest function
  url: "https://<REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/a2aEndpoint",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [
    {
      id: "echo_skill",
      name: "Echo Skill",
      description: "Repeats back the input message.",
      tags: ["utility", "echo"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain"],
      examples: ["User: Hello Agent. Agent: Hello User, you said: Hello Agent."],
    },
  ],
  provider: {
    organization: "LaunchpadAI",
    url: "https://launchpad.ai", // Replace with actual URL
  },
};

export const a2aEndpoint = onRequest(
  { cors: true }, // Firebase's built-in CORS option for v2 onRequest
  async (request, response) => {
    logger.info("A2A Endpoint called", { method: request.method, body: request.body });

    if (request.method !== "POST") {
      // A2A typically uses POST for JSON-RPC messages.
      // You could serve the AgentCard on GET to the base URL as a non-standard extension.
      if (request.method === "GET") {
        logger.info("GET request received, returning Agent Card (non-standard)");
        response.status(200).json(MY_AGENT_CARD);
        return;
      }
      logger.warn("Invalid request method", { method: request.method });
      response.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const { method, params, id, jsonrpc } = request.body as any; // Cast as any for now, proper validation should be added

    if (jsonrpc !== "2.0") {
      logger.error("Invalid JSON-RPC version", { jsonrpc });
      response.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: { code: -32600, message: "Invalid Request - JSON-RPC version must be 2.0" },
      } as JSONRPCErrorResponse);
      return;
    }

    if (method === "agent/card") { // This is a custom method for fetching the card via POST
      logger.info("Returning Agent Card via agent/card method");
      response.status(200).json({
        jsonrpc: "2.0",
        id: id || null,
        result: MY_AGENT_CARD,
      });
      return;
    }

    if (method === "message/send") {
      const sendMessageParams = params as MessageSendParams;
      logger.info("Received message/send request", { params: sendMessageParams });

      const incomingMessage = sendMessageParams.message;
      if (incomingMessage.parts[0]?.kind === "text" && typeof incomingMessage.parts[0]?.text === 'string') {
        const responseMessage: Message = {
          messageId: `agent-msg-${Date.now()}`,
          role: "agent",
          kind: "message",
          parts: [
            {
              kind: "text",
              text: `You said: ${incomingMessage.parts[0].text}`,
            },
          ],
          taskId: incomingMessage.taskId, 
          contextId: incomingMessage.contextId, 
        };

        const rpcResponse: SendMessageSuccessResponse = {
          jsonrpc: "2.0",
          id: id || null,
          result: responseMessage,
        };
        logger.info("Sending echo response", { response: rpcResponse });
        response.status(200).json(rpcResponse);
        return;
      }

      logger.warn("Could not process message/send, no valid text part found", { params });
      response.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: { code: -32602, message: "Invalid params - Expected a valid text message part." },
      } as JSONRPCErrorResponse);
      return;
    }

    logger.warn("Method not found", { method });
    response.status(404).json({
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32601, message: `Method not found: ${method}` },
    } as JSONRPCErrorResponse);
  }
);
