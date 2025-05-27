// /Users/robsmith/dev/launchpadai/web/src/app/api/a2a/types.ts

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface AgentCapabilityDetails {
  method: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  // Potentially add other fields like 'parameters' if methods take specific structured params beyond the main 'message'
}

export interface AgentAuthentication {
  type: "none" | "apiKey" | "oauth2"; // Add other types as needed
  // Fields for apiKey
  apiKeyName?: string; // e.g., "X-API-Key"
  apiKeyLocation?: "header" | "query";
  // Fields for oauth2
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: Record<string, string>;
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  logoUrl?: string;
  websiteUrl?: string;
  provider?: {
    name: string;
    url?: string;
  };
  capabilities: AgentCapabilityDetails[];
  authentication?: AgentAuthentication;
  metadata?: Record<string, any>; // For any other custom data
}

export interface ResponseMessagePart {
  kind: "text" | "image" | "file" | "tool_code" | "tool_outputs" | "data"; // Expanded based on common agent interactions
  text?: string;
  url?: string; // For kind: "image" or "file"
  filename?: string; // For kind: "file"
  language?: string; // For kind: "tool_code"
  code?: string; // For kind: "tool_code"
  outputs?: any[]; // For kind: "tool_outputs"
  data?: any; // For kind: "data"
  contentType?: string; // MIME type, e.g., "application/json", "image/png"
}

export interface MessageContext {
  conversationId?: string;
  parentMessageId?: string;
  taskId?: string;
  // Add any other contextual IDs or data relevant to your application
}

export interface Message {
  messageId: string;
  timestamp: string; // ISO 8601 format
  role: "user" | "agent" | "system";
  kind: "message" | "control" | "event"; // Control for protocol, Event for system events
  parts: ResponseMessagePart[];
  context?: MessageContext;
  metadata?: Record<string, any>; // Additional non-standard data
}

export interface SendMessageParams {
  message: {
    // Simplified for now, aligning with what the endpoint expects
    parts: Array<{ kind: "text"; text: string; [key: string]: any }>;
    context?: MessageContext;
    // Other fields from the full Message interface can be added if needed by the sender
  };
  // Configuration for the agent's response, e.g., preferred formats, streaming
  configuration?: {
    acceptedOutputParts?: Array<ResponseMessagePart['kind']>;
    stream?: boolean;
  };
}

export interface SendMessageSuccessResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result: Message; // The agent's response message
}

export interface GetAgentCardSuccessResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result: AgentCard;
}
