"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Terminal } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface CommandExamplesProps {
  agent: Agent;
  currentConfig: {
    authType: "bearer" | "apikey" | "none";
    responseType: "streaming" | "single";
    apiKey: string;
  };
}

export function CommandExamples({
  agent,
  currentConfig,
}: CommandExamplesProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getEndpointUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://your-domain.com";
    return `${baseUrl}/api/agents/public/${agent.id}/chat`;
  };

  const getAuthHeader = () => {
    const apiKey = currentConfig.apiKey || "your-api-key";
    if (currentConfig.authType === "bearer") {
      return `Authorization: Bearer ${apiKey}`;
    } else if (currentConfig.authType === "apikey") {
      return `X-API-Key: ${apiKey}`;
    }
    return "";
  };

  const generateCurlCommand = () => {
    const authHeader = getAuthHeader();
    const responseTypeHeader =
      currentConfig.responseType === "single"
        ? `\n  -H "X-Response-Type: single" \\`
        : "";

    return `curl -X POST "${getEndpointUrl()}" \\
  -H "Content-Type: application/json" \\${authHeader ? `\n  -H "${authHeader}" \\` : ""}${responseTypeHeader}
  -d '{
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Hello, how can you help me?"
      }
    ]
  }'`;
  };

  const generateWgetCommand = () => {
    const authHeader = getAuthHeader();
    const responseTypeHeader =
      currentConfig.responseType === "single"
        ? `\n  --header="X-Response-Type: single" \\`
        : "";

    return `wget --method=POST \\
  --header="Content-Type: application/json" \\${authHeader ? `\n  --header="${authHeader}" \\` : ""}${responseTypeHeader}
  --body-data='{
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Hello, how can you help me?"
      }
    ]
  }' \\
  --output-document=- \\
  "${getEndpointUrl()}"`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Command Examples
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="wget">wget</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">cURL Command</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateCurlCommand(), "curl")}
                className="flex items-center gap-2"
              >
                {copiedStates["curl"] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedStates["curl"] ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {generateCurlCommand()}
            </pre>
          </TabsContent>

          <TabsContent value="wget" className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">wget Command</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateWgetCommand(), "wget")}
                className="flex items-center gap-2"
              >
                {copiedStates["wget"] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedStates["wget"] ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {generateWgetCommand()}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
