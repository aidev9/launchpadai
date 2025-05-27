"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Zap,
  Plus,
  Settings,
  TestTube,
  Play,
  User,
  Bot,
} from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface McpTabProps {
  agent: Agent;
}

interface McpEndpoint {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  url: string;
  authType: "api_key" | "bearer_token";
  authCredentials: {
    apiKey?: string;
    bearerToken?: string;
  };
  accessControl: {
    allowedIps: string[];
    rateLimitPerMinute: number;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface McpTestingProps {
  agent: Agent;
}

function McpTesting({ agent }: McpTestingProps) {
  const [testMessage, setTestMessage] = useState("Hello, how can you help me?");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const getEndpointUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://your-domain.com";
    return `${baseUrl}/api/agents/${agent.id}/public/chat`;
  };

  const testMcpCall = async () => {
    if (!testMessage.trim()) return;

    setIsTestLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: testMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, assistantMessage]);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (agent.configuration.apiKey) {
        headers["X-API-Key"] = agent.configuration.apiKey;
      }

      // Format the request body to match the chat endpoint expectations
      const requestBody = {
        message: testMessage,
        context: {
          conversation_id: `test-conversation-${Date.now()}`,
          user_id: "test-user",
        },
      };

      const response = await fetch(getEndpointUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}\n${errorText}`
        );
      }

      // Handle the response
      const data = await response.json();
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  data.response || data.text || JSON.stringify(data, null, 2),
              }
            : msg
        )
      );

      // Clear the input
      setTestMessage("");

      toast({
        title: "Success",
        description: "MCP test completed successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update assistant message with error
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${errorMessage}` }
            : msg
        )
      );

      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test MCP Endpoint
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={chatMessages.length === 0}
            data-testid="clear-mcp-chat-button"
          >
            Clear Chat
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages Area */}
        <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto bg-muted/20">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Start a conversation to test your MCP endpoint
                </p>
                <p className="text-xs mt-1 opacity-70">
                  This tests the same endpoint that MCP clients will use
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content || (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            Thinking...
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter your test message..."
              rows={1}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  testMcpCall();
                }
              }}
              disabled={isTestLoading}
            />
            <Button
              onClick={testMcpCall}
              disabled={
                isTestLoading ||
                !testMessage.trim() ||
                !agent.configuration.isEnabled ||
                !agent.configuration.apiKey
              }
              className="self-end"
              data-testid="test-mcp-call-button"
            >
              {isTestLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Press Enter to send, Shift+Enter for new line</p>
            {(!agent.configuration.isEnabled ||
              !agent.configuration.apiKey) && (
              <p className="text-amber-600">
                ⚠️ Agent must be enabled and have an API key to test MCP
                endpoint
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function McpTab({ agent }: McpTabProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [mcpEndpoints, setMcpEndpoints] = useState<McpEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock data for now - in real implementation, this would come from Firebase
  useEffect(() => {
    // Simulate loading MCP endpoints for this agent
    const mockEndpoints: McpEndpoint[] = [
      {
        id: "mcp-1",
        name: `${agent.name} MCP Endpoint`,
        description: `MCP endpoint for ${agent.name} agent`,
        isEnabled: true,
        url: `/api/mcp/agents/${agent.id}`,
        authType: "api_key",
        authCredentials: {
          apiKey:
            agent.configuration.apiKey || "mcp_key_" + agent.id.slice(0, 8),
        },
        accessControl: {
          allowedIps: [],
          rateLimitPerMinute: 60,
        },
      },
    ];
    setMcpEndpoints(mockEndpoints);
  }, [agent]);

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

  const generateMcpConfig = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    return JSON.stringify(
      {
        mcpServers: {
          [agent.name.toLowerCase().replace(/\s+/g, "-")]: {
            command: "curl",
            args: [
              "-X",
              "POST",
              `${baseUrl}/api/mcp/agents/${agent.id}`,
              "-H",
              "Content-Type: application/json",
              "-H",
              `x-api-key: ${agent.configuration.apiKey || "your-api-key"}`,
              "-d",
              "@-",
            ],
          },
        },
      },
      null,
      2
    );
  };

  const generateCurlExample = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    return `curl -X POST "${baseUrl}/api/mcp/agents/${agent.id}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${agent.configuration.apiKey || "your-api-key"}" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MCP (Model Context Protocol) Integration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Expose your agent as an MCP server for use with Claude Desktop and
            other MCP clients
          </p>
        </CardHeader>
      </Card>

      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Endpoint Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">MCP Endpoint URL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <code className="text-sm break-all">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : "https://your-domain.com"}
                      /api/mcp/agents/{agent.id}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/mcp/agents/${agent.id}`,
                        "mcp-url"
                      )
                    }
                  >
                    {copiedStates["mcp-url"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["mcp-url"] ? "Copied!" : "Copy URL"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>API Key</Label>
                    <Badge
                      variant={
                        agent.configuration.apiKey ? "default" : "secondary"
                      }
                    >
                      {agent.configuration.apiKey ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  {agent.configuration.apiKey && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <code className="text-sm">
                        {agent.configuration.apiKey.substring(0, 8)}...
                      </code>
                    </div>
                  )}
                  {!agent.configuration.apiKey && (
                    <p className="text-sm text-muted-foreground">
                      Configure an API key in the API tab to enable MCP access
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Status and Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Agent Status</Label>
                    <Badge
                      variant={
                        agent.configuration.isEnabled ? "default" : "secondary"
                      }
                    >
                      {agent.configuration.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>MCP Ready</Label>
                    <Badge
                      variant={
                        agent.configuration.isEnabled &&
                        agent.configuration.apiKey
                          ? "default"
                          : "secondary"
                      }
                    >
                      {agent.configuration.isEnabled &&
                      agent.configuration.apiKey
                        ? "Ready"
                        : "Not Ready"}
                    </Badge>
                  </div>
                  {(!agent.configuration.isEnabled ||
                    !agent.configuration.apiKey) && (
                    <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-800">
                        {!agent.configuration.isEnabled &&
                          "Enable your agent and "}
                        {!agent.configuration.apiKey && "configure an API key "}
                        to use MCP integration
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>chat</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>get_agent_info</span>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    {agent.collections && agent.collections.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span>search_knowledge</span>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Claude Desktop Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add this configuration to your Claude Desktop settings to
                connect this agent
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Configuration File</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(generateMcpConfig(), "mcp-config")
                    }
                  >
                    {copiedStates["mcp-config"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["mcp-config"] ? "Copied!" : "Copy Config"}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {generateMcpConfig()}
                  </pre>
                </div>
              </div>

              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2 text-blue-800">
                  Setup Instructions
                </h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Open Claude Desktop application</li>
                  <li>Go to Settings → Developer</li>
                  <li>
                    Edit the MCP settings file (claude_desktop_config.json)
                  </li>
                  <li>Add the configuration above to the file</li>
                  <li>Save the file and restart Claude Desktop</li>
                  <li>Your agent will appear as an available MCP server</li>
                </ol>
                <div className="mt-3 p-3 border border-green-200 bg-green-50 rounded">
                  <p className="text-xs text-green-700">
                    <strong>No installation required!</strong> The configuration
                    uses <code>curl</code> which is built into macOS and
                    Windows. Make sure your agent is enabled and has an API key
                    configured.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">cURL Example</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the MCP endpoint directly with cURL
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Test Command</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(generateCurlExample(), "curl-example")
                    }
                  >
                    {copiedStates["curl-example"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["curl-example"] ? "Copied!" : "Copy Command"}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {generateCurlExample()}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Testing Interface */}
            <div className="space-y-4">
              <McpTesting agent={agent} />
            </div>

            {/* Right Column: Troubleshooting */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Troubleshooting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                      <h5 className="font-medium text-sm text-red-800 mb-1">
                        "Server disconnected" Error
                      </h5>
                      <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                        <li>
                          Ensure your LaunchpadAI server is running
                          (localhost:3000)
                        </li>
                        <li>
                          Check that the agent is enabled and has an API key
                        </li>
                        <li>
                          Verify the MCP configuration is correctly formatted
                        </li>
                        <li>
                          Try restarting Claude Desktop after configuration
                          changes
                        </li>
                        <li>Make sure curl is available in your PATH</li>
                      </ul>
                    </div>

                    <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-sm text-blue-800 mb-1">
                        Connection Issues
                      </h5>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>
                          Make sure you're using the correct URL (localhost:3000
                          for local development)
                        </li>
                        <li>
                          Check that no firewall is blocking the connection
                        </li>
                        <li>
                          Verify the API key is correct and hasn't expired
                        </li>
                        <li>
                          Test the endpoint directly with the chat interface
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">
                      Manual Testing Steps
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Test the endpoint with the chat interface on the left
                      </li>
                      <li>
                        If that works, copy the MCP configuration to Claude
                        Desktop
                      </li>
                      <li>Restart Claude Desktop completely</li>
                      <li>
                        Check if the MCP server appears in Claude's available
                        tools
                      </li>
                      <li>Try using the agent through Claude Desktop</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick cURL Test</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test the underlying HTTP endpoint directly
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <code className="text-sm break-all">
                      curl -X POST "
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : "https://your-domain.com"}
                      /api/agents/{agent.id}/public/chat" \<br />
                      &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                      &nbsp;&nbsp;-H "X-API-Key:{" "}
                      {agent.configuration.apiKey || "your-api-key"}" \<br />
                      &nbsp;&nbsp;-d '
                      {`{"message": "Hello, how can you help me?"}`}'
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/agents/${agent.id}/public/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${agent.configuration.apiKey || "your-api-key"}" \\
  -d '{"message": "Hello, how can you help me?"}'`,
                        "test-curl"
                      )
                    }
                  >
                    {copiedStates["test-curl"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedStates["test-curl"]
                      ? "Copied!"
                      : "Copy Test Command"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
