"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface HtmlTabProps {
  agent: Agent;
}

export function HtmlTab({ agent }: HtmlTabProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-5 w-5" />
          HTML/JavaScript
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add a chat widget to any HTML page with vanilla JavaScript
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Script Tag */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Include Script</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  `<script src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/js/launchpad-chat.min.js"></script>`,
                  "script-tag"
                )
              }
              className="flex items-center gap-2"
            >
              {copiedStates["script-tag"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["script-tag"] ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              {`<script src="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/js/launchpad-chat.min.js"></script>`}
            </pre>
          </div>
        </div>

        {/* Full HTML Example */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Complete Example</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with AI Chat</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    
    <!-- Chat Widget Container -->
    <div id="launchpad-chat"></div>
    
    <!-- Include LaunchpadAI Script -->
    <script src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/js/launchpad-chat.min.js"></script>
    
    <!-- Initialize Chat Widget -->
    <script>
        LaunchpadChat.init({
            containerId: 'launchpad-chat',
            agentId: '${agent.id}',
            apiKey: '${agent.configuration.apiKey || "your-api-key"}',
            theme: 'light',
            width: '400px',
            height: '600px',
            position: 'bottom-right' // or 'bottom-left', 'inline'
        });
    </script>
</body>
</html>`,
                  "html-example"
                )
              }
              className="flex items-center gap-2"
            >
              {copiedStates["html-example"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["html-example"] ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with AI Chat</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    
    <!-- Chat Widget Container -->
    <div id="launchpad-chat"></div>
    
    <!-- Include LaunchpadAI Script -->
    <script src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/js/launchpad-chat.min.js"></script>
    
    <!-- Initialize Chat Widget -->
    <script>
        LaunchpadChat.init({
            containerId: 'launchpad-chat',
            agentId: '${agent.id}',
            apiKey: '${agent.configuration.apiKey || "your-api-key"}',
            theme: 'light',
            width: '400px',
            height: '600px',
            position: 'bottom-right' // or 'bottom-left', 'inline'
        });
    </script>
</body>
</html>`}
            </pre>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Configuration Options</h3>
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm mb-2">Position Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="p-2 border rounded text-center">
                  <code>bottom-right</code>
                </div>
                <div className="p-2 border rounded text-center">
                  <code>bottom-left</code>
                </div>
                <div className="p-2 border rounded text-center">
                  <code>inline</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
