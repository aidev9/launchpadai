"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Globe } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface ReactTabProps {
  agent: Agent;
}

export function ReactTab({ agent }: ReactTabProps) {
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
          <Globe className="h-5 w-5" />
          React Component
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Integrate your agent into React applications
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* NPM Package */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Install Package</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  "npm install @launchpadai/react-chat",
                  "npm-install"
                )
              }
              className="flex items-center gap-2"
            >
              {copiedStates["npm-install"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["npm-install"] ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm">
              {`npm install @launchpadai/react-chat`}
            </pre>
          </div>
        </div>

        {/* React Component Code */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Component Usage</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  `import { LaunchpadChat } from '@launchpadai/react-chat';

function App() {
  return (
    <div>
      <LaunchpadChat
        agentId="${agent.id}"
        apiKey="${agent.configuration.apiKey || "your-api-key"}"
        theme="light"
        width="400px"
        height="600px"
        placeholder="Ask me anything..."
      />
    </div>
  );
}`,
                  "react-component"
                )
              }
              className="flex items-center gap-2"
            >
              {copiedStates["react-component"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["react-component"] ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {`import { LaunchpadChat } from '@launchpadai/react-chat';

function App() {
  return (
    <div>
      <LaunchpadChat
        agentId="${agent.id}"
        apiKey="${agent.configuration.apiKey || "your-api-key"}"
        theme="light"
        width="400px"
        height="600px"
        placeholder="Ask me anything..."
      />
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        {/* Props Documentation */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Component Props</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Required</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-mono">agentId</td>
                  <td className="p-3">string</td>
                  <td className="p-3">Yes</td>
                  <td className="p-3">Your agent ID</td>
                </tr>
                <tr className="border-t bg-muted/20">
                  <td className="p-3 font-mono">apiKey</td>
                  <td className="p-3">string</td>
                  <td className="p-3">Yes</td>
                  <td className="p-3">Your API key</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono">theme</td>
                  <td className="p-3">'light' | 'dark'</td>
                  <td className="p-3">No</td>
                  <td className="p-3">Chat theme</td>
                </tr>
                <tr className="border-t bg-muted/20">
                  <td className="p-3 font-mono">width</td>
                  <td className="p-3">string</td>
                  <td className="p-3">No</td>
                  <td className="p-3">Component width</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono">height</td>
                  <td className="p-3">string</td>
                  <td className="p-3">No</td>
                  <td className="p-3">Component height</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
