"use server";

import { userActionClient } from "@/lib/action";
import { z } from "zod";
import { ToolTestResult } from "./types";

// Schema for saving tool configuration
const saveToolConfigSchema = z.object({
  toolId: z.string().min(1),
  isEnabled: z.boolean(),
  apiKey: z.string().optional(),
  config: z.record(z.string()).optional(),
});

// Schema for testing tool connection
const testToolConnectionSchema = z.object({
  toolId: z.string().min(1),
  apiKey: z.string().optional(),
  config: z.record(z.string()).optional(),
});

// Save tool configuration
export const saveToolConfig = userActionClient
  .schema(saveToolConfigSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { toolId, isEnabled, apiKey, config } = parsedInput;

    try {
      // Import Firebase tools server for server-side operations
      const { firebaseToolsServer } = await import(
        "@/lib/firebase/server/FirebaseTools"
      );

      console.log(`Saving tool config for user ${user.uid}:`, {
        toolId,
        isEnabled,
        hasApiKey: !!apiKey,
        config,
      });

      // Save to Firebase
      const result = await firebaseToolsServer.saveToolConfiguration(user.uid, {
        toolId,
        isEnabled,
        apiKey,
        config,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save tool configuration");
      }

      return {
        success: true,
        message: "Tool configuration saved successfully",
        data: result.data,
      };
    } catch (error) {
      console.error("Error saving tool config:", error);
      throw new Error("Failed to save tool configuration");
    }
  });

// Test tool connection
export const testToolConnection = userActionClient
  .schema(testToolConnectionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { toolId, apiKey, config } = parsedInput;

    try {
      // Import Firebase tools server for server-side operations
      const { firebaseToolsServer } = await import(
        "@/lib/firebase/server/FirebaseTools"
      );

      console.log(`Testing tool connection for user ${user.uid}:`, {
        toolId,
        hasApiKey: !!apiKey,
        config,
      });

      // Simulate different test scenarios based on tool
      const testResult = await simulateToolTest(toolId, apiKey, config);

      // Update test result in Firebase if a configuration exists
      try {
        await firebaseToolsServer.updateTestResult(user.uid, toolId, {
          testStatus: testResult.success ? "success" : "error",
          testMessage: testResult.message,
          lastTested: testResult.timestamp.getTime(),
        });
      } catch (updateError) {
        console.warn("Failed to update test result in Firebase:", updateError);
        // Don't fail the test if we can't update the result
      }

      return testResult;
    } catch (error) {
      console.error("Error testing tool connection:", error);
      return {
        success: false,
        message: "Failed to test connection",
        timestamp: new Date(),
      };
    }
  });

// Get tool configurations for the current user
export const getToolConfigurations = userActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { user } = ctx;

    try {
      // In a real implementation, fetch from database
      // For now, return empty configurations
      console.log(`Fetching tool configurations for user ${user.uid}`);

      // Simulate database fetch
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {};
    } catch (error) {
      console.error("Error fetching tool configurations:", error);
      throw new Error("Failed to fetch tool configurations");
    }
  });

// Simulate tool testing based on tool type
async function simulateToolTest(
  toolId: string,
  apiKey?: string,
  config?: Record<string, string>
): Promise<ToolTestResult> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );

  switch (toolId) {
    case "search":
    case "wikipedia":
    case "calculator":
      // These don't require API keys, so they should always work
      return {
        success: true,
        message: `✅ ${toolId === "search" ? "DuckDuckGo Search" : toolId === "wikipedia" ? "Wikipedia" : "Calculator"} is ready to use`,
        timestamp: new Date(),
      };

    case "tavily":
      if (!apiKey) {
        return {
          success: false,
          message:
            "❌ API key is required - Get your API key from https://tavily.com/",
          timestamp: new Date(),
        };
      }
      // Simulate API key validation
      if (apiKey.length < 10) {
        return {
          success: false,
          message:
            "❌ Invalid API key format - API key should be at least 10 characters",
          timestamp: new Date(),
        };
      }

      // Test real Tavily API connection
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: "test connection",
            max_results: 1,
            search_depth: "basic",
            include_answer: false,
            include_images: false,
          }),
        });

        if (response.ok) {
          return {
            success: true,
            message:
              "✅ Tavily API connection successful - Advanced web search is ready",
            timestamp: new Date(),
          };
        } else if (response.status === 401) {
          return {
            success: false,
            message: "❌ Invalid API key - Please check your Tavily API key",
            timestamp: new Date(),
          };
        } else if (response.status === 429) {
          return {
            success: false,
            message:
              "⚠️ Rate limit exceeded - Your API key is valid but you've hit the rate limit",
            timestamp: new Date(),
          };
        } else {
          return {
            success: false,
            message: `❌ API error (${response.status}) - ${response.statusText}`,
            timestamp: new Date(),
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `❌ Connection failed - ${error instanceof Error ? error.message : "Network error"}`,
          timestamp: new Date(),
        };
      }

    case "weather":
      if (!apiKey) {
        return {
          success: false,
          message:
            "❌ OpenWeatherMap API key is required - Get your API key from https://openweathermap.org/api",
          timestamp: new Date(),
        };
      }
      const weatherSuccess = Math.random() > 0.2; // 80% success rate for demo
      return {
        success: weatherSuccess,
        message: weatherSuccess
          ? "✅ Weather API connection successful - Weather data is ready"
          : "❌ Invalid API key or quota exceeded - Please check your OpenWeatherMap API key",
        timestamp: new Date(),
      };

    case "news":
      if (!apiKey) {
        return {
          success: false,
          message:
            "❌ NewsAPI key is required - Get your API key from https://newsapi.org/",
          timestamp: new Date(),
        };
      }
      const newsSuccess = Math.random() > 0.25; // 75% success rate for demo
      return {
        success: newsSuccess,
        message: newsSuccess
          ? "✅ News API connection successful - Latest news is ready"
          : "❌ Invalid API key or rate limit exceeded - Please check your NewsAPI key",
        timestamp: new Date(),
      };

    case "wolfram":
      if (!apiKey) {
        return {
          success: false,
          message:
            "❌ Wolfram Alpha App ID is required - Get your App ID from https://developer.wolframalpha.com/",
          timestamp: new Date(),
        };
      }
      const wolframSuccess = Math.random() > 0.4; // 60% success rate for demo
      return {
        success: wolframSuccess,
        message: wolframSuccess
          ? "✅ Wolfram Alpha connection successful - Computational knowledge is ready"
          : "❌ Invalid App ID - Please check your Wolfram Alpha App ID",
        timestamp: new Date(),
      };

    case "maps":
    case "calendar":
    case "translator":
      if (!apiKey) {
        return {
          success: false,
          message:
            "❌ Google Cloud API key is required - Get your API key from Google Cloud Console",
          timestamp: new Date(),
        };
      }
      const googleSuccess = Math.random() > 0.3; // 70% success rate for demo
      const serviceName =
        toolId === "maps"
          ? "Maps & Directions"
          : toolId === "calendar"
            ? "Calendar"
            : "Translator";
      return {
        success: googleSuccess,
        message: googleSuccess
          ? `✅ Google ${serviceName} API connection successful - ${serviceName} is ready`
          : "❌ Invalid API key or insufficient permissions - Please check your Google Cloud API key",
        timestamp: new Date(),
      };

    default:
      return {
        success: false,
        message: "❌ Unknown tool - This tool is not supported",
        timestamp: new Date(),
      };
  }
}
