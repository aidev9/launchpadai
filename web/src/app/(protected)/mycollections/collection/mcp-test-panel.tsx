"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { McpEndpointConfig } from "@/lib/firebase/schema/mcp-endpoints";
import { useToast } from "@/hooks/use-toast";

interface McpTestPanelProps {
  endpoint: McpEndpointConfig;
}

export function McpTestPanel({ endpoint }: McpTestPanelProps) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate endpoint URL
  const endpointUrl = `${window.location.origin}/api/mcp/${endpoint.id}`;

  const handleTest = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

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

      // Make the request
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          limit: parseInt(limit) || 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test MCP Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint-url">Endpoint URL</Label>
            <Input
              id="endpoint-url"
              value={endpointUrl}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-type">Authentication Type</Label>
            <Input
              id="auth-type"
              value={
                endpoint.authType === "api_key" ? "API Key" : "Bearer Token"
              }
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-value">
              {endpoint.authType === "api_key" ? "API Key" : "Bearer Token"}
            </Label>
            <Input
              id="auth-value"
              value={
                endpoint.authType === "api_key"
                  ? endpoint.authCredentials.apiKey || ""
                  : endpoint.authCredentials.bearerToken || ""
              }
              readOnly
              className="bg-muted"
              type="password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Result Limit</Label>
            <Input
              id="limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              type="number"
              min="1"
              max="50"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={isLoading || !query.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Endpoint"
            )}
          </Button>
        </CardContent>
      </Card>

      {(response || error) && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {response.totalResults || 0} results
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Page {response.page || 1} of {response.totalPages || 1}
                  </p>
                </div>
                <Textarea
                  value={JSON.stringify(response, null, 2)}
                  readOnly
                  className="font-mono text-sm h-80"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code snippet section */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here's how to use this endpoint in your code:
            </p>

            <div className="space-y-2">
              <Label>JavaScript/TypeScript</Label>
              <Textarea
                readOnly
                className="font-mono text-sm h-48"
                value={`// Example code to query the MCP endpoint
const searchDocuments = async (query) => {
  try {
    const response = await fetch("${endpointUrl}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ${
          endpoint.authType === "api_key"
            ? `"x-api-key": "YOUR_API_KEY"`
            : `"Authorization": "Bearer YOUR_BEARER_TOKEN"`
        }
      },
      body: JSON.stringify({
        query: query,
        limit: 10
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching documents:", error);
    throw error;
  }
};

// Usage
searchDocuments("your search query")
  .then(results => console.log(results))
  .catch(error => console.error(error));`}
              />
            </div>

            <div className="space-y-2">
              <Label>Python</Label>
              <Textarea
                readOnly
                className="font-mono text-sm h-48"
                value={`# Example code to query the MCP endpoint
import requests
import json

def search_documents(query, limit=10):
    url = "${endpointUrl}"
    
    headers = {
        "Content-Type": "application/json",
        ${
          endpoint.authType === "api_key"
            ? `"x-api-key": "YOUR_API_KEY"`
            : `"Authorization": "Bearer YOUR_BEARER_TOKEN"`
        }
    }
    
    payload = {
        "query": query,
        "limit": limit
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        return response.json()
    except Exception as e:
        print(f"Error searching documents: {e}")
        raise

# Usage
try:
    results = search_documents("your search query")
    print(json.dumps(results, indent=2))
except Exception as e:
    print(f"Error: {e}")`}
              />
            </div>

            <div className="space-y-2">
              <Label>wget (Command Line)</Label>
              <Textarea
                readOnly
                className="font-mono text-sm h-48"
                value={`# Example wget command to query the MCP endpoint
wget --quiet \\
  --method POST \\
  --header 'Content-Type: application/json' \\
  ${
    endpoint.authType === "api_key"
      ? `--header 'x-api-key: YOUR_API_KEY' \\`
      : `--header 'Authorization: Bearer YOUR_BEARER_TOKEN' \\`
  }
  --body-data '{"query":"your search query","limit":10}' \\
  --output-document - \\
  ${endpointUrl}

# For Windows PowerShell:
# wget -Method POST -Headers @{"Content-Type"="application/json"; ${
                  endpoint.authType === "api_key"
                    ? `"x-api-key"="YOUR_API_KEY"`
                    : `"Authorization"="Bearer YOUR_BEARER_TOKEN"`
                }} -Body '{"query":"your search query","limit":10}' -Uri "${endpointUrl}" | Select-Object -Expand Content`}
              />
            </div>

            <div className="space-y-2">
              <Label>curl (Command Line)</Label>
              <Textarea
                readOnly
                className="font-mono text-sm h-48"
                value={`# Example curl command to query the MCP endpoint
curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  ${
    endpoint.authType === "api_key"
      ? `-H "x-api-key: YOUR_API_KEY" \\`
      : `-H "Authorization: Bearer YOUR_BEARER_TOKEN" \\`
  }
  -d '{"query":"your search query","limit":10}'

# Pretty-print the JSON response
curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  ${
    endpoint.authType === "api_key"
      ? `-H "x-api-key: YOUR_API_KEY" \\`
      : `-H "Authorization: Bearer YOUR_BEARER_TOKEN" \\`
  }
  -d '{"query":"your search query","limit":10}' | jq

# Save response to a file
curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  ${
    endpoint.authType === "api_key"
      ? `-H "x-api-key: YOUR_API_KEY" \\`
      : `-H "Authorization: Bearer YOUR_BEARER_TOKEN" \\`
  }
  -d '{"query":"your search query","limit":10}' \\
  -o search_results.json`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
