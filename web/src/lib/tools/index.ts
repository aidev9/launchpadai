import { tool } from "ai";
import { z } from "zod";

// Tool implementations
export const searchTool = tool({
  description: "Search the web using DuckDuckGo",
  parameters: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({ query, maxResults }) => {
    try {
      // Use DuckDuckGo Instant Answer API (no API key required)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data = await response.json();

      // Format the response
      const results = [];

      if (data.Abstract) {
        results.push({
          title: data.Heading || "DuckDuckGo Result",
          snippet: data.Abstract,
          url: data.AbstractURL,
          source: data.AbstractSource,
        });
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics.filter(
          (topic: any) => topic.Text && topic.FirstURL
        )
          .slice(0, maxResults - results.length)
          .map((topic: any) => ({
            title: topic.Text.split(" - ")[0] || "Related Topic",
            snippet: topic.Text,
            url: topic.FirstURL,
            source: "DuckDuckGo",
          }));
        results.push(...topics);
      }

      if (results.length === 0) {
        return {
          success: false,
          message: "No results found for the search query",
          results: [],
        };
      }

      return {
        success: true,
        message: `Found ${results.length} search results`,
        results: results.slice(0, maxResults),
      };
    } catch (error) {
      console.error("Search tool error:", error);
      return {
        success: false,
        message: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        results: [],
      };
    }
  },
});

export const tavilySearchTool = (apiKey: string) =>
  tool({
    description: "Advanced web search using Tavily API",
    parameters: z.object({
      query: z.string().describe("The search query"),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return"),
      searchDepth: z
        .enum(["basic", "advanced"])
        .optional()
        .default("basic")
        .describe("Search depth"),
    }),
    execute: async ({ query, maxResults, searchDepth }) => {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true,
            include_images: false,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Tavily API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        return {
          success: true,
          message: `Found ${data.results?.length || 0} search results`,
          answer: data.answer,
          results: data.results || [],
        };
      } catch (error) {
        console.error("Tavily search tool error:", error);
        return {
          success: false,
          message: `Tavily search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          results: [],
        };
      }
    },
  });

export const weatherTool = (apiKey: string) =>
  tool({
    description: "Get current weather and forecasts using OpenWeatherMap",
    parameters: z.object({
      location: z
        .string()
        .describe(
          "City name, state code, and country code (e.g., 'London,UK' or 'New York,NY,US')"
        ),
      units: z
        .enum(["metric", "imperial", "kelvin"])
        .optional()
        .default("metric")
        .describe("Temperature units"),
    }),
    execute: async ({ location, units }) => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Location not found");
          }
          throw new Error(
            `OpenWeatherMap API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        const unitSymbol =
          units === "metric" ? "°C" : units === "imperial" ? "°F" : "K";

        return {
          success: true,
          message: `Current weather for ${data.name}, ${data.sys.country}`,
          weather: {
            location: `${data.name}, ${data.sys.country}`,
            temperature: `${Math.round(data.main.temp)}${unitSymbol}`,
            feelsLike: `${Math.round(data.main.feels_like)}${unitSymbol}`,
            description: data.weather[0].description,
            humidity: `${data.main.humidity}%`,
            windSpeed: `${data.wind.speed} ${units === "metric" ? "m/s" : "mph"}`,
            pressure: `${data.main.pressure} hPa`,
            visibility: data.visibility
              ? `${data.visibility / 1000} km`
              : "N/A",
          },
        };
      } catch (error) {
        console.error("Weather tool error:", error);
        return {
          success: false,
          message: `Weather lookup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });

export const newsTool = (apiKey: string) =>
  tool({
    description: "Get latest news articles from various sources",
    parameters: z.object({
      query: z.string().optional().describe("Search query for news articles"),
      category: z
        .enum([
          "business",
          "entertainment",
          "general",
          "health",
          "science",
          "sports",
          "technology",
        ])
        .optional()
        .describe("News category"),
      country: z
        .string()
        .optional()
        .describe("Country code (e.g., 'us', 'gb', 'ca')"),
      pageSize: z
        .number()
        .optional()
        .default(5)
        .describe("Number of articles to return (max 20)"),
    }),
    execute: async ({ query, category, country, pageSize }) => {
      try {
        let url = "https://newsapi.org/v2/";
        const params = new URLSearchParams();

        if (query) {
          url += "everything";
          params.append("q", query);
          params.append("sortBy", "publishedAt");
        } else {
          url += "top-headlines";
          if (category) params.append("category", category);
          if (country) params.append("country", country);
        }

        params.append("pageSize", Math.min(pageSize, 20).toString());
        params.append("apiKey", apiKey);

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(
            `NewsAPI error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.status !== "ok") {
          throw new Error(data.message || "NewsAPI request failed");
        }

        const articles = data.articles.map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          author: article.author,
        }));

        return {
          success: true,
          message: `Found ${articles.length} news articles`,
          totalResults: data.totalResults,
          articles,
        };
      } catch (error) {
        console.error("News tool error:", error);
        return {
          success: false,
          message: `News lookup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          articles: [],
        };
      }
    },
  });

export const calculatorTool = tool({
  description: "Perform mathematical calculations",
  parameters: z.object({
    expression: z
      .string()
      .describe(
        "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')"
      ),
  }),
  execute: async ({ expression }) => {
    try {
      // Simple math expression evaluator (safe evaluation)
      // This is a basic implementation - in production, you might want to use a more robust math library
      const sanitizedExpression = expression
        .replace(/[^0-9+\-*/().\s]/g, "") // Remove unsafe characters
        .replace(/\s+/g, ""); // Remove spaces

      // Basic validation
      if (!sanitizedExpression || sanitizedExpression.length === 0) {
        throw new Error("Invalid mathematical expression");
      }

      // Use Function constructor for safe evaluation (limited scope)
      const result = Function(
        `"use strict"; return (${sanitizedExpression})`
      )();

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error("Result is not a valid number");
      }

      return {
        success: true,
        message: `Calculation completed`,
        expression: expression,
        result: result,
        formattedResult: result.toString(),
      };
    } catch (error) {
      console.error("Calculator tool error:", error);
      return {
        success: false,
        message: `Calculation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        expression: expression,
      };
    }
  },
});

export const wikipediaTool = tool({
  description: "Search and retrieve information from Wikipedia",
  parameters: z.object({
    query: z.string().describe("Search query for Wikipedia"),
    sentences: z
      .number()
      .optional()
      .default(3)
      .describe("Number of sentences to return in summary"),
  }),
  execute: async ({ query, sentences }) => {
    try {
      // First, search for the page
      const searchResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      );

      if (!searchResponse.ok) {
        if (searchResponse.status === 404) {
          throw new Error("Wikipedia page not found");
        }
        throw new Error(`Wikipedia API error: ${searchResponse.status}`);
      }

      const data = await searchResponse.json();

      // Extract the summary
      let summary = data.extract;
      if (summary && sentences > 0) {
        const sentenceArray = summary.split(". ");
        summary = sentenceArray.slice(0, sentences).join(". ");
        if (sentenceArray.length > sentences) {
          summary += ".";
        }
      }

      return {
        success: true,
        message: `Found Wikipedia article: ${data.title}`,
        title: data.title,
        summary: summary || "No summary available",
        url: data.content_urls?.desktop?.page,
        thumbnail: data.thumbnail?.source,
        coordinates: data.coordinates,
      };
    } catch (error) {
      console.error("Wikipedia tool error:", error);
      return {
        success: false,
        message: `Wikipedia search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

export const wolframTool = (appId: string) =>
  tool({
    description: "Query Wolfram Alpha computational knowledge engine",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Query for Wolfram Alpha (e.g., 'integrate x^2', 'population of Tokyo', 'solve x^2 + 2x + 1 = 0')"
        ),
    }),
    execute: async ({ query }) => {
      try {
        const response = await fetch(
          `https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          if (response.status === 501) {
            throw new Error("Wolfram Alpha could not understand the query");
          }
          throw new Error(`Wolfram Alpha API error: ${response.status}`);
        }

        const result = await response.text();

        return {
          success: true,
          message: "Wolfram Alpha computation completed",
          query: query,
          result: result,
        };
      } catch (error) {
        console.error("Wolfram tool error:", error);
        return {
          success: false,
          message: `Wolfram Alpha query failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          query: query,
        };
      }
    },
  });

export const mapsTool = (apiKey: string) =>
  tool({
    description:
      "Get maps, directions, and location information using Google Maps",
    parameters: z.object({
      query: z.string().describe("Location query or address"),
      type: z
        .enum(["geocode", "directions", "places"])
        .optional()
        .default("geocode")
        .describe("Type of maps query"),
      origin: z.string().optional().describe("Origin location for directions"),
      destination: z
        .string()
        .optional()
        .describe("Destination location for directions"),
    }),
    execute: async ({ query, type, origin, destination }) => {
      try {
        let url = "https://maps.googleapis.com/maps/api/";
        const params = new URLSearchParams();
        params.append("key", apiKey);

        switch (type) {
          case "geocode":
            url += "geocode/json";
            params.append("address", query);
            break;
          case "directions":
            url += "directions/json";
            params.append("origin", origin || query);
            params.append("destination", destination || query);
            break;
          case "places":
            url += "place/textsearch/json";
            params.append("query", query);
            break;
        }

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Google Maps API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "OK") {
          throw new Error(`Google Maps API error: ${data.status}`);
        }

        return {
          success: true,
          message: `Google Maps ${type} query completed`,
          type: type,
          query: query,
          results: data.results || data.routes || [],
        };
      } catch (error) {
        console.error("Maps tool error:", error);
        return {
          success: false,
          message: `Maps query failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          type: type,
          query: query,
        };
      }
    },
  });

export const calendarTool = (apiKey: string, calendarId: string = "primary") =>
  tool({
    description: "Access and manage Google Calendar events",
    parameters: z.object({
      action: z
        .enum(["list", "create", "get"])
        .describe("Calendar action to perform"),
      timeMin: z
        .string()
        .optional()
        .describe("Start time for event listing (ISO 8601)"),
      timeMax: z
        .string()
        .optional()
        .describe("End time for event listing (ISO 8601)"),
      maxResults: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of events to return"),
      summary: z.string().optional().describe("Event title for creation"),
      startTime: z.string().optional().describe("Event start time (ISO 8601)"),
      endTime: z.string().optional().describe("Event end time (ISO 8601)"),
      eventId: z
        .string()
        .optional()
        .describe("Event ID for getting specific event"),
    }),
    execute: async ({
      action,
      timeMin,
      timeMax,
      maxResults,
      summary,
      startTime,
      endTime,
      eventId,
    }) => {
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
        const headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };

        switch (action) {
          case "list":
            const params = new URLSearchParams();
            if (timeMin) params.append("timeMin", timeMin);
            if (timeMax) params.append("timeMax", timeMax);
            params.append("maxResults", maxResults.toString());
            params.append("singleEvents", "true");
            params.append("orderBy", "startTime");

            const listResponse = await fetch(`${url}?${params.toString()}`, {
              headers,
            });
            if (!listResponse.ok)
              throw new Error(`Calendar API error: ${listResponse.status}`);

            const listData = await listResponse.json();
            return {
              success: true,
              message: `Found ${listData.items?.length || 0} calendar events`,
              events: listData.items || [],
            };

          case "create":
            if (!summary || !startTime || !endTime) {
              throw new Error(
                "Summary, start time, and end time are required for event creation"
              );
            }

            const createResponse = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify({
                summary,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
              }),
            });

            if (!createResponse.ok)
              throw new Error(`Calendar API error: ${createResponse.status}`);

            const createData = await createResponse.json();
            return {
              success: true,
              message: "Calendar event created successfully",
              event: createData,
            };

          case "get":
            if (!eventId) {
              throw new Error(
                "Event ID is required for getting specific event"
              );
            }

            const getResponse = await fetch(`${url}/${eventId}`, { headers });
            if (!getResponse.ok)
              throw new Error(`Calendar API error: ${getResponse.status}`);

            const getData = await getResponse.json();
            return {
              success: true,
              message: "Calendar event retrieved successfully",
              event: getData,
            };

          default:
            throw new Error(`Unknown calendar action: ${action}`);
        }
      } catch (error) {
        console.error("Calendar tool error:", error);
        return {
          success: false,
          message: `Calendar operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          action: action,
        };
      }
    },
  });

export const translatorTool = (apiKey: string) =>
  tool({
    description: "Translate text between languages using Google Translate",
    parameters: z.object({
      text: z.string().describe("Text to translate"),
      targetLanguage: z
        .string()
        .describe(
          "Target language code (e.g., 'es' for Spanish, 'fr' for French)"
        ),
      sourceLanguage: z
        .string()
        .optional()
        .describe("Source language code (auto-detect if not provided)"),
    }),
    execute: async ({ text, targetLanguage, sourceLanguage }) => {
      try {
        const url = "https://translation.googleapis.com/language/translate/v2";
        const params = new URLSearchParams();
        params.append("key", apiKey);
        params.append("q", text);
        params.append("target", targetLanguage);
        if (sourceLanguage) params.append("source", sourceLanguage);

        const response = await fetch(`${url}?${params.toString()}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`Google Translate API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const translation = data.data.translations[0];

        return {
          success: true,
          message: "Translation completed successfully",
          originalText: text,
          translatedText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage,
          targetLanguage: targetLanguage,
        };
      } catch (error) {
        console.error("Translator tool error:", error);
        return {
          success: false,
          message: `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          originalText: text,
          targetLanguage: targetLanguage,
        };
      }
    },
  });

// Tool factory function that creates tools based on configuration
export function createToolsFromConfig(
  toolConfigs: Array<{
    toolId: string;
    isEnabled: boolean;
    apiKey?: string;
    config?: Record<string, string>;
  }>
) {
  const tools: Record<string, any> = {};

  for (const config of toolConfigs) {
    if (!config.isEnabled) continue;

    switch (config.toolId) {
      case "search":
        tools.search = searchTool;
        break;
      case "tavily":
        if (config.apiKey) {
          tools.tavily = tavilySearchTool(config.apiKey);
        }
        break;
      case "weather":
        if (config.apiKey) {
          tools.weather = weatherTool(config.apiKey);
        }
        break;
      case "news":
        if (config.apiKey) {
          tools.news = newsTool(config.apiKey);
        }
        break;
      case "calculator":
        tools.calculator = calculatorTool;
        break;
      case "wikipedia":
        tools.wikipedia = wikipediaTool;
        break;
      case "wolfram":
        if (config.apiKey) {
          tools.wolfram = wolframTool(config.apiKey);
        }
        break;
      case "maps":
        if (config.apiKey) {
          tools.maps = mapsTool(config.apiKey);
        }
        break;
      case "calendar":
        if (config.apiKey) {
          const calendarId = config.config?.calendarId || "primary";
          tools.calendar = calendarTool(config.apiKey, calendarId);
        }
        break;
      case "translator":
        if (config.apiKey) {
          tools.translator = translatorTool(config.apiKey);
        }
        break;
    }
  }

  return tools;
}

// Helper function to get tool configurations for a user
export async function getUserToolConfigurations(userId: string) {
  try {
    const { firebaseToolsServer } = await import(
      "@/lib/firebase/server/FirebaseTools"
    );

    // Get the query and execute it
    const query = firebaseToolsServer.getToolConfigurations(userId);
    if (!query) {
      console.error("Failed to create tool configurations query");
      return [];
    }

    const snapshot = await query.get();
    const toolConfigs = snapshot.docs.map((doc) => doc.data());

    return toolConfigs;
  } catch (error) {
    console.error("Error getting user tool configurations:", error);
    return [];
  }
}
