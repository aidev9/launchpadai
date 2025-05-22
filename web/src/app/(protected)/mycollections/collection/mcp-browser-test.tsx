"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { McpEndpointConfig } from "@/lib/firebase/schema/mcp-endpoints";

interface McpBrowserTestProps {
  endpoint: McpEndpointConfig;
}

export function McpBrowserTest({ endpoint }: McpBrowserTestProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Generate endpoint URL
  const endpointUrl = `${window.location.origin}/api/mcp/${endpoint.id}`;

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setAiResponse(null);

    try {
      // Prepare headers based on auth type
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (endpoint.authType === "api_key") {
        headers["x-api-key"] = endpoint.authCredentials.apiKey || "";
      } else if (endpoint.authType === "bearer_token") {
        headers["Authorization"] = `Bearer ${
          endpoint.authCredentials.bearerToken || ""
        }`;
      }

      // Make the request to the MCP endpoint
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          limit: 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }

      setResponse(data);

      // If we have results, generate an AI response
      if (data.success && data.results && data.results.length > 0) {
        await generateAiResponse(data.results, query);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiResponse = async (results: any[], userQuery: string) => {
    try {
      // Format the results for the AI
      const formattedResults = results.map((result) => ({
        document_title: result.document_title,
        content: result.chunk_content,
        similarity: result.similarity,
      }));

      // Make a request to the OpenAI API
      const response = await fetch("/api/ai/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userQuery,
          results: formattedResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI response");
      }

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Don't show this error to the user, just log it
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MCP Browser Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-2"
          >
            <label htmlFor="query" className="text-sm font-medium">
              Search Query
            </label>
            <div className="flex space-x-2">
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query"
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {aiResponse && (
            <Card>
              <CardHeader>
                <CardTitle>AI Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{aiResponse}</div>
              </CardContent>
            </Card>
          )}

          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Raw Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Found {response.totalResults || 0} results</span>
                  <span>
                    Page {response.page || 1} of {response.totalPages || 1}
                  </span>
                </div>
                <Textarea
                  value={JSON.stringify(response, null, 2)}
                  readOnly
                  className="font-mono text-sm h-80"
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
