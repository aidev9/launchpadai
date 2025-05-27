"use server";

import { userActionClient } from "@/lib/action";
import { z } from "zod";
import { serverAgentsService } from "@/lib/firebase/server/agents";
import { revalidatePath } from "next/cache";

const toggleAgentStatusSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  isEnabled: z.boolean(),
});

const updateAgentApiConfigSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  apiKey: z.string().optional(),
  authType: z.enum(["bearer", "apikey", "none"]).optional(),
  responseType: z.enum(["streaming", "single"]).optional(),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
  allowedIps: z.array(z.string()).optional(),
});

export const toggleAgentStatus = userActionClient
  .schema(toggleAgentStatusSchema)
  .action(async ({ parsedInput: { agentId, isEnabled }, ctx }) => {
    try {
      // Get the current agent
      const currentAgent = await serverAgentsService.getAgentById(
        ctx.user.uid,
        agentId
      );

      if (!currentAgent) {
        throw new Error("Agent not found");
      }

      // Debug logging
      console.log("[toggleAgentStatus] Debug info:", {
        agentId,
        currentUserId: ctx.user.uid,
        agentUserId: currentAgent.userId,
        userIdMatch: currentAgent.userId === ctx.user.uid,
      });

      // Note: Authorization is handled by Firebase security rules
      // The fact that we can retrieve the agent means the user has access to it

      // Update the agent with the new status
      const updatedAgent = {
        ...currentAgent,
        configuration: {
          ...currentAgent.configuration,
          isEnabled,
        },
      };

      const result = await serverAgentsService.updateAgent(
        ctx.user.uid,
        updatedAgent
      );

      if (!result) {
        throw new Error("Failed to update agent status");
      }

      // Revalidate the myagents page to reflect changes
      revalidatePath("/myagents");

      return {
        success: true,
        agent: result,
        message: `Agent ${isEnabled ? "enabled" : "disabled"} successfully`,
      };
    } catch (error) {
      console.error("[toggleAgentStatus] Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to update agent status"
      );
    }
  });

export const updateAgentApiConfig = userActionClient
  .schema(updateAgentApiConfigSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { agentId, ...configUpdates } = parsedInput;

      // Get the current agent
      const currentAgent = await serverAgentsService.getAgentById(
        ctx.user.uid,
        agentId
      );

      if (!currentAgent) {
        throw new Error("Agent not found");
      }

      // Update the agent configuration
      const updatedAgent = {
        ...currentAgent,
        configuration: {
          ...currentAgent.configuration,
          ...configUpdates,
        },
      };

      const result = await serverAgentsService.updateAgent(
        ctx.user.uid,
        updatedAgent
      );

      if (!result) {
        throw new Error("Failed to update agent API configuration");
      }

      // Revalidate the agent page to reflect changes
      revalidatePath("/myagents/agent");

      return {
        success: true,
        agent: result,
        message: "API configuration saved successfully",
      };
    } catch (error) {
      console.error("[updateAgentApiConfig] Error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update API configuration"
      );
    }
  });
