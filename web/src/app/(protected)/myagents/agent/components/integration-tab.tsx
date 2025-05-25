"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Globe,
  Code,
  Link,
  MessageSquare,
  Users,
  Workflow,
  Bot,
  Zap,
  Settings,
} from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface IntegrationTabProps {
  agent: Agent;
}

export function IntegrationTab({ agent }: IntegrationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("general");
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

  const getIntegrationCount = () => {
    const mcpCount = agent.mcpEndpoints?.length || 0;
    const a2aCount = agent.a2aEndpoints?.length || 0;
    const toolsCount = agent.tools?.length || 0;
    return mcpCount + a2aCount + toolsCount;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Configure external integrations for your agent •{" "}
            {getIntegrationCount()} total integrations
          </p>
        </div>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span className="hidden lg:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="iframe" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden lg:inline">IFrame</span>
          </TabsTrigger>
          <TabsTrigger value="react" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="hidden lg:inline">React</span>
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden lg:inline">HTML</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            <span className="hidden lg:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="slack" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span className="hidden lg:inline">Slack</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden lg:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="n8n" className="flex items-center gap-1">
            <Workflow className="h-3 w-3" />
            <span className="hidden lg:inline">N8N</span>
          </TabsTrigger>
          <TabsTrigger value="flowise" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            <span className="hidden lg:inline">Flowise</span>
          </TabsTrigger>
          <TabsTrigger value="dify" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className="hidden lg:inline">Dify</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your agent to various platforms and services
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Agent Endpoint</h3>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <code className="text-sm">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : "https://your-domain.com"}
                      /api/agents/{agent.configuration.url || agent.id}
                    </code>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">API Key</h3>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <code className="text-sm">
                      {agent.configuration.apiKey
                        ? `${agent.configuration.apiKey.substring(0, 8)}...`
                        : "Not configured"}
                    </code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {agent.mcpEndpoints?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MCP Endpoints
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {agent.a2aEndpoints?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Agent Connections
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {agent.tools?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Tools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {agent.collections?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Collections
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IFrame Tab */}
        <TabsContent value="iframe" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-5 w-5" />
                IFrame Embed
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Embed a chat interface for your agent into any HTML page
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* IFrame Code Snippet */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">IFrame Embed Code</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `<iframe
  src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/embed/agent/${agent.id}?theme=light"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
  title="${agent.name} Chat">
</iframe>`,
                        "iframe-code"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    {copiedStates["iframe-code"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["iframe-code"] ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {`<iframe
  src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/embed/agent/${agent.id}?theme=light"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
  title="${agent.name} Chat">
</iframe>`}
                  </pre>
                </div>
              </div>

              {/* Customization Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Customization Options</h3>
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium text-sm">Theme Options</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Light Theme</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/embed/agent/${agent.id}?theme=light`,
                              "light-theme"
                            )
                          }
                        >
                          {copiedStates["light-theme"] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dark Theme</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/embed/agent/${agent.id}?theme=dark`,
                              "dark-theme"
                            )
                          }
                        >
                          {copiedStates["dark-theme"] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium text-sm">Size Presets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="text-center p-2 border rounded">
                        <div className="text-xs text-muted-foreground">
                          Small
                        </div>
                        <div className="text-sm font-mono">300x400</div>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <div className="text-xs text-muted-foreground">
                          Medium
                        </div>
                        <div className="text-sm font-mono">400x600</div>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <div className="text-xs text-muted-foreground">
                          Large
                        </div>
                        <div className="text-sm font-mono">500x700</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="w-80 h-96 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Chat Widget Preview
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* React Tab */}
        <TabsContent value="react" className="space-y-4 mt-4">
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
                        <th className="text-left p-3 font-medium">
                          Description
                        </th>
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
        </TabsContent>

        {/* HTML Tab */}
        <TabsContent value="html" className="space-y-4 mt-4">
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
                    {`<script src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/js/launchpad-chat.min.js"></script>`}
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
                    <h4 className="font-medium text-sm mb-2">
                      Position Options
                    </h4>
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
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="h-5 w-5" />
                REST API
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Direct API integration for custom applications
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Endpoint</h3>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      POST
                    </Badge>
                    <code className="text-sm">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : "https://your-domain.com"}
                      /api/agents/{agent.configuration.url || agent.id}
                    </code>
                  </div>
                </div>
              </div>

              {/* cURL Example */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">cURL Example</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.configuration.url || agent.id}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${agent.configuration.apiKey || "your-api-key"}" \\
  -d '{
    "message": "Hello, how can you help me?",
    "context": {
      "user": "user123",
      "conversation_id": "conv456"
    }
  }'`,
                        "curl-example"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    {copiedStates["curl-example"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["curl-example"] ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {`curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.configuration.url || agent.id}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${agent.configuration.apiKey || "your-api-key"}" \\
  -d '{
    "message": "Hello, how can you help me?",
    "context": {
      "user": "user123",
      "conversation_id": "conv456"
    }
  }'`}
                  </pre>
                </div>
              </div>

              {/* Request/Response Schema */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Request Body</h3>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {`{
  "message": "string (required)",
  "context": {
    "user": "string (optional)",
    "conversation_id": "string (optional)",
    "metadata": "object (optional)"
  }
}`}
                    </pre>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Response</h3>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {`{
  "response": "string",
  "metadata": {
    "agent_id": "${agent.id}",
    "timestamp": "ISO string",
    "tools_used": ["array"]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Authentication
                </h4>
                <p className="text-sm text-muted-foreground">
                  Include your API key in the Authorization header:{" "}
                  <code>
                    Bearer {agent.configuration.apiKey || "your-api-key"}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slack Tab */}
        <TabsContent value="slack" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Slack Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Deploy your agent as a Slack bot
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li>
                    1. Create a new Slack app at{" "}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      api.slack.com/apps
                    </a>
                  </li>
                  <li>
                    2. Enable Bot Token Scopes: <code>chat:write</code>,{" "}
                    <code>app_mentions:read</code>
                  </li>
                  <li>3. Add the webhook URL to your Slack app settings</li>
                  <li>4. Install the app to your workspace</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Webhook URL</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/integrations/slack/${agent.id}`,
                        "slack-webhook"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    {copiedStates["slack-webhook"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["slack-webhook"] ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <code className="text-sm">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : "https://your-domain.com"}
                    /api/integrations/slack/{agent.id}
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Required Headers</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">X-Slack-Signature</span>
                    <span className="text-xs text-muted-foreground">
                      Slack request signature
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">
                      X-Slack-Request-Timestamp
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Request timestamp
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Microsoft Teams Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Deploy your agent as a Microsoft Teams bot
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li>1. Register your bot in Azure Bot Service</li>
                  <li>2. Create a Microsoft Teams app manifest</li>
                  <li>3. Configure the messaging endpoint</li>
                  <li>4. Upload to Teams or publish to App Store</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Messaging Endpoint</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/integrations/teams/${agent.id}`,
                        "teams-endpoint"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    {copiedStates["teams-endpoint"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["teams-endpoint"] ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <code className="text-sm">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : "https://your-domain.com"}
                    /api/integrations/teams/{agent.id}
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Bot Framework Configuration
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">App ID</span>
                    <span className="text-xs text-muted-foreground">
                      Azure Bot App ID
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">App Password</span>
                    <span className="text-xs text-muted-foreground">
                      Azure Bot App Secret
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* N8N Tab */}
        <TabsContent value="n8n" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                N8N Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your agent to N8N workflows
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  HTTP Request Node Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Method & URL</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          POST
                        </Badge>
                        <code className="text-sm">
                          {typeof window !== "undefined"
                            ? window.location.origin
                            : "https://your-domain.com"}
                          /api/agents/{agent.id}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Headers</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="p-2 border rounded text-sm bg-muted/30"
                          value="Content-Type"
                          readOnly
                        />
                        <input
                          className="p-2 border rounded text-sm bg-muted/30"
                          value="application/json"
                          readOnly
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="p-2 border rounded text-sm bg-muted/30"
                          value="Authorization"
                          readOnly
                        />
                        <input
                          className="p-2 border rounded text-sm bg-muted/30"
                          value={`Bearer ${agent.configuration.apiKey || "your-api-key"}`}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Body (JSON)</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`{
  "message": "{{ $json.message }}",
  "context": {
    "user": "{{ $json.user }}",
    "workflow_id": "{{ $workflow.id }}"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                <h4 className="font-medium text-sm mb-2">Quick Setup</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use this workflow template to get started quickly:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `{
  "name": "LaunchpadAI Agent Integration",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "url": "${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.id}",
        "options": {
          "headers": {
            "Authorization": "Bearer ${agent.configuration.apiKey || "your-api-key"}",
            "Content-Type": "application/json"
          }
        },
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "message",
              "value": "={{ $json.message }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ]
}`,
                      "n8n-workflow"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {copiedStates["n8n-workflow"] ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedStates["n8n-workflow"] ? "Copied!" : "Copy Workflow"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flowise Tab */}
        <TabsContent value="flowise" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Flowise Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your agent to Flowise chatflows
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  API Call Node Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      Endpoint Configuration
                    </h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs text-muted-foreground">
                          URL
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 border rounded text-sm bg-muted/30">
                            {typeof window !== "undefined"
                              ? window.location.origin
                              : "https://your-domain.com"}
                            /api/agents/{agent.id}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.id}`,
                                "flowise-url"
                              )
                            }
                          >
                            {copiedStates["flowise-url"] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Method
                        </label>
                        <div className="p-2 border rounded text-sm bg-muted/30">
                          POST
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Headers</h4>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <code>
                          Authorization: Bearer{" "}
                          {agent.configuration.apiKey || "your-api-key"}
                        </code>
                      </div>
                      <div className="text-sm">
                        <code>Content-Type: application/json</code>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      Request Body Template
                    </h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`{
  "message": "{{input}}",
  "context": {
    "chatflow_id": "{{chatflowId}}",
    "session_id": "{{sessionId}}"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <h4 className="font-medium text-sm mb-2">Integration Tips</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use the API Call node in your Flowise chatflow</li>
                  <li>• Configure error handling for robust workflows</li>
                  <li>• Parse the response to extract the agent's reply</li>
                  <li>• Consider implementing retry logic for reliability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dify Tab */}
        <TabsContent value="dify" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Dify Integration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your agent to Dify workflows and applications
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  HTTP Request Tool Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Tool Settings</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Tool Name
                          </label>
                          <div className="p-2 border rounded text-sm bg-muted/30">
                            LaunchpadAI Agent
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Method
                          </label>
                          <div className="p-2 border rounded text-sm bg-muted/30">
                            POST
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          URL
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 border rounded text-sm bg-muted/30">
                            {typeof window !== "undefined"
                              ? window.location.origin
                              : "https://your-domain.com"}
                            /api/agents/{agent.id}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.id}`,
                                "dify-url"
                              )
                            }
                          >
                            {copiedStates["dify-url"] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      Headers Configuration
                    </h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Key</div>
                        <div className="font-medium">Value</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <code className="p-2 border rounded text-sm bg-muted/30">
                          Authorization
                        </code>
                        <code className="p-2 border rounded text-sm bg-muted/30">
                          Bearer {agent.configuration.apiKey || "your-api-key"}
                        </code>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <code className="p-2 border rounded text-sm bg-muted/30">
                          Content-Type
                        </code>
                        <code className="p-2 border rounded text-sm bg-muted/30">
                          application/json
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Request Body</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`{
  "message": "{{input.message}}",
  "context": {
    "user": "{{user.id}}",
    "conversation_id": "{{conversation.id}}",
    "dify_app_id": "{{app.id}}"
  }
}`}
                    </pre>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      Response Handling
                    </h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`{
  "response": "{{response.response}}",
  "metadata": {{response.metadata}}
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <h4 className="font-medium text-sm mb-2">
                  Workflow Integration
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Add this as a Custom Tool in your Dify application</li>
                  <li>• Use variable substitution for dynamic inputs</li>
                  <li>• Configure output parsing to use the response</li>
                  <li>• Test the integration before deploying</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
