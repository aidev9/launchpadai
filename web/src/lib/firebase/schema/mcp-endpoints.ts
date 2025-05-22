import { z } from "zod";

// New interface for MCP endpoint configuration
export interface McpEndpointConfig {
  id: string;
  collectionId: string;
  userId: string;
  name: string;
  description: string;
  isEnabled: boolean;
  authType: "api_key" | "bearer_token";
  authCredentials: {
    apiKey?: string;
    bearerToken?: string;
  };
  accessControl: {
    allowedIps: string[];
    rateLimitPerMinute: number;
  };
  createdAt: number;
  updatedAt: number;
}

// Schema for MCP endpoint configuration validation
export const mcpEndpointConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string(),
  isEnabled: z.boolean().default(true),
  authType: z.enum(["api_key", "bearer_token"]),
  authCredentials: z.object({
    apiKey: z.string().optional(),
    bearerToken: z.string().optional(),
  }),
  accessControl: z.object({
    allowedIps: z.array(z.string()).default([]),
    rateLimitPerMinute: z.number().min(1).max(100).default(60),
  }),
});

export type McpEndpointConfigInput = z.infer<typeof mcpEndpointConfigSchema>;
