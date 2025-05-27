"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiSchemaProps {
  currentConfig: {
    responseType: "streaming" | "single";
  };
}

export function ApiSchema({ currentConfig }: ApiSchemaProps) {
  const getResponseSchema = () => {
    if (currentConfig.responseType === "streaming") {
      return `// Streaming Response (text/plain)
// Each chunk contains part of the AI response
// Example chunks:
"Hello"
" there!"
" How can"
" I help"
" you today?"

// Final response is the concatenation of all chunks`;
    } else {
      return `// Single Response (application/json)
{
  "response": "Hello there! How can I help you today?",
  "metadata": {
    "agent_id": "agent-123",
    "timestamp": "2025-01-15T10:30:00Z",
    "model": "gpt-4o-mini",
    "tokens_used": 42
  }
}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">API Schema</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-2">
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              {`{
  "messages": [
    {
      "id": "string (required)",
      "role": "user" | "assistant" | "system",
      "content": "string (required)"
    }
  ]
}

// Optional Headers:
// X-Response-Type: "single" | "streaming" (default: streaming)
// Authorization: Bearer <token> (if using Bearer auth)
// X-API-Key: <key> (if using API Key auth)`}
            </pre>
          </TabsContent>

          <TabsContent value="response" className="space-y-2">
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              {getResponseSchema()}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
