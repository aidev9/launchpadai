"use client";

import { useState, useEffect, useRef } from "react";
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
  Bot,
  Plus,
  Settings,
  ExternalLink,
  User,
  Send,
  Trash2,
  Play,
  Loader2, // Ensured Loader2 was imported
} from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown"; // Added import
import { A2aOAuthConfig } from "./a2a-oauth-config";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";

interface A2aTabProps {
  agent: Agent;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: any;
  id: string | number | null;
}

interface A2aChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  rawResponse?: string;
  isLoading?: boolean;
  isError?: boolean;
}

interface A2aEndpoint {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  url: string;
  authType: "oauth2" | "api_key";
  authCredentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
  };
  capabilities: string[];
}

export function A2aTab({ agent }: A2aTabProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [activeSubTab, setActiveSubTab] = useState("testing");
  const [a2aEndpoints, setA2aEndpoints] = useState<A2aEndpoint[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [testEndpointUrl, setTestEndpointUrl] = useState("/api/a2a");
  const [testMessageIdPrefix, setTestMessageIdPrefix] = useState("a2a-chat");
  const [currentTestMessageId, setCurrentTestMessageId] = useState(
    `${testMessageIdPrefix}-${Date.now()}`
  );
  const [testContextId, setTestContextId] = useState("");
  const [testTaskId, setTestTaskId] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<A2aChatMessage[]>([]);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockEndpoints: A2aEndpoint[] = [
      {
        id: "a2a-1",
        name: `${agent.name} A2A Endpoint`,
        description: `Agent2Agent endpoint for ${agent.name}`,
        isEnabled: true,
        url: `/api/a2a/agents/${agent.id}/chat`, // Specific agent chat endpoint
        authType: "oauth2",
        authCredentials: {
          clientId: "a2a_client_" + agent.id.slice(0, 8),
          clientSecret: "a2a_secret_" + agent.id.slice(0, 8),
        },
        capabilities: ["chat", "reasoning", "knowledge_search"],
      },
    ];
    setA2aEndpoints(mockEndpoints);
    if (mockEndpoints.length > 0 && mockEndpoints[0].url) {
      setTestEndpointUrl(mockEndpoints[0].url);
    }
  }, [agent]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateA2aConfig = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    return JSON.stringify(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          version: "1.0.0",
          capabilities: [
            "chat",
            "reasoning",
            ...(agent.collections && agent.collections.length > 0
              ? ["knowledge_search"]
              : []),
          ],
          endpoints: {
            chat: `${baseUrl}/api/a2a/agents/${agent.id}/chat`,
            capabilities: `${baseUrl}/api/a2a/agents/${agent.id}/capabilities`,
            health: `${baseUrl}/api/a2a/agents/${agent.id}/health`,
          },
          authentication: {
            type: "oauth2",
            authorization_url: `${baseUrl}/api/a2a/auth/authorize`,
            token_url: `${baseUrl}/api/a2a/auth/token`,
            client_id:
              agent.configuration.a2aOAuth?.clientId || "YOUR_A2A_CLIENT_ID",
            client_secret:
              agent.configuration.a2aOAuth?.clientSecret ||
              "YOUR_A2A_CLIENT_SECRET",
          },
        },
      },
      null,
      2
    );
  };

  const generateGoogleA2aExample = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    return JSON.stringify(
      {
        provider_id: "launchpad-ai-agent-" + agent.id,
        agent_invocations: [
          {
            agent_id: agent.id,
            invocation_config: {
              endpoint_type: "HTTP_ENDPOINT",
              http_endpoint: {
                url: `${baseUrl}/api/a2a/agents/${agent.id}/chat`,
              },
            },
            display_name: agent.name,
            description: agent.description,
          },
        ],
      },
      null,
      2
    );
  };

  const handleTestA2aMessage = async () => {
    if (!chatInput.trim()) return;
    if (!testEndpointUrl.trim()) {
      toast({
        title: "Error",
        description: "A2A Endpoint URL is required.",
        variant: "destructive",
      });
      return;
    }

    console.log("[A2A Test] Sending message:", chatInput);
    setIsTestLoading(true);
    const userMessageContent = chatInput;
    const nextMessageId = `${testMessageIdPrefix}-${Date.now()}`;
    setCurrentTestMessageId(nextMessageId);

    const userMessage: A2aChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantPlaceholderMessage: A2aChatMessage = {
      id: assistantMessageId,
      role: "agent",
      content: "Thinking...",
      timestamp: new Date(),
      isLoading: true,
    };
    setChatMessages((prevMessages) => [
      ...prevMessages,
      assistantPlaceholderMessage,
    ]);

    const a2aMessageObject = {
      id: nextMessageId,
      role: "user" as const,
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };

    const contextObject = {
      conversation_id: testContextId || undefined,
      task_id: testTaskId || undefined,
    };

    let actualRequestBody: any;
    const defaultAgentChatUrl = `/api/a2a/agents/${agent.id}/chat`;

    if (testEndpointUrl === defaultAgentChatUrl) {
      actualRequestBody = {
        message: a2aMessageObject,
        context: contextObject,
      };
      console.log(
        "[A2A Test] Using simplified request body for agent chat endpoint:",
        JSON.stringify(actualRequestBody, null, 2)
      );
    } else {
      actualRequestBody = {
        jsonrpc: "2.0",
        method: "message/send" as const,
        id: nextMessageId,
        params: {
          message: a2aMessageObject,
          context: contextObject,
        },
      };
      console.log(
        "[A2A Test] Using JSON-RPC request body:",
        JSON.stringify(actualRequestBody, null, 2)
      );
    }

    console.log("[A2A Test] Request to URL:", testEndpointUrl);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (
        testEndpointUrl === defaultAgentChatUrl &&
        agent.configuration?.apiKey
      ) {
        headers["Authorization"] = `Bearer ${agent.configuration.apiKey}`;
        console.log("[A2A Test] Using API Key for Authorization");
      } else if (
        testEndpointUrl === defaultAgentChatUrl &&
        !agent.configuration?.apiKey
      ) {
        console.warn(
          "[A2A Test] Default agent chat URL is used, but agent API key is missing. Authorization header will not be set."
        );
      }

      const response = await fetch(testEndpointUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(actualRequestBody),
      });

      const responseData = await response.json();
      console.log("[A2A Test] Response status:", response.status);
      console.log(
        "[A2A Test] Response data:",
        JSON.stringify(responseData, null, 2)
      );

      if (
        !response.ok ||
        (responseData.error && testEndpointUrl !== defaultAgentChatUrl)
      ) {
        const errorMsg =
          responseData.error?.message ||
          responseData.error ||
          `HTTP error! status: ${response.status} - ${response.statusText}`;
        console.error("[A2A Test] Error response:", errorMsg);
        setChatMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Error: ${String(errorMsg)}`,
                  isLoading: false,
                  isError: true,
                  rawResponse: JSON.stringify(responseData, null, 2),
                }
              : msg
          )
        );
        setIsTestLoading(false);
        return;
      }

      let agentResponseText = "Error: Could not parse agent response.";
      const rawResponseForDisplay = JSON.stringify(responseData, null, 2);

      if (testEndpointUrl === defaultAgentChatUrl) {
        if (responseData.success && typeof responseData.response === "string") {
          agentResponseText = responseData.response;
        } else if (responseData.error) {
          agentResponseText = `Error: ${responseData.error.message || responseData.error}`;
        } else if (
          !responseData.success &&
          responseData.response &&
          typeof responseData.response === "string"
        ) {
          agentResponseText = responseData.response;
        } else {
          agentResponseText = `Error: Unexpected response format from ${testEndpointUrl}`;
        }
      } else {
        if (responseData.result?.content) {
          agentResponseText = responseData.result.content;
        } else if (responseData.error) {
          agentResponseText = `Error: ${responseData.error.message} (Code: ${responseData.error.code})`;
          if (responseData.error.data) {
            agentResponseText += ` Data: ${JSON.stringify(responseData.error.data)}`;
          }
        } else {
          agentResponseText = `Error: Unexpected A2A JSON-RPC response from ${testEndpointUrl}`;
        }
      }

      setChatMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: agentResponseText,
                isLoading: false,
                rawResponse: rawResponseForDisplay,
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error("[A2A Test] Fetch error:", error);
      setChatMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Error: ${error.message}`,
                isLoading: false,
                isError: true,
                rawResponse: JSON.stringify(error, null, 2),
              }
            : msg
        )
      );
    }
    setIsTestLoading(false);
  };

  const clearChat = () => {
    setChatMessages([]);
    console.log("[A2A Test] Chat cleared.");
  };

  const updateAgentConfig = async (
    updates: Partial<typeof agent.configuration>
  ) => {
    setIsSaving(true);
    try {
      const updatedAgent = {
        ...agent,
        configuration: {
          ...agent.configuration,
          ...updates,
        },
      };

      const result = await firebaseAgents.updateAgent(updatedAgent);

      if (result) {
        toast({
          title: "Success",
          description: "A2A configuration saved successfully",
        });
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save A2A configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>A2A Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure and test Agent-to-Agent (A2A) communication protocols.
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

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is A2A?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Agent-to-Agent (A2A) communication enables your AI agent to
                  interact directly with other AI agents, services, or platforms
                  that support compatible protocols. This allows for complex
                  workflows, data exchange, and collaborative task execution
                  between different AI systems.
                </p>
                <p className="text-sm">
                  Launchpad AI supports A2A via a standardized JSON-RPC 2.0
                  interface over HTTP. Your agent will expose an endpoint that
                  other agents can call, and it can similarly call other agents'
                  A2A endpoints.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Concepts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Endpoint:</strong> The URL where your agent listens
                    for A2A requests.
                  </li>
                  <li>
                    <strong>Agent Card:</strong> A discoverable JSON object
                    describing your agent's capabilities, methods, and
                    authentication requirements.
                  </li>
                  <li>
                    <strong>Methods:</strong> Standardized operations like
                    `message/send`, `tasks/create`, `agent/card`.
                  </li>
                  <li>
                    <strong>JSON-RPC 2.0:</strong> The underlying communication
                    protocol.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Getting Started</AlertTitle>
            <AlertDescription>
              To enable A2A for your agent, you typically need to:
              <ul className="list-disc pl-5 mt-1 text-xs">
                <li>
                  Implement the required A2A methods in your agent's backend.
                </li>
                <li>
                  Configure the A2A endpoint URL in your agent's settings.
                </li>
                <li>
                  Ensure proper authentication and authorization mechanisms are
                  in place.
                </li>
                <li>
                  The <code>/api/a2a/agents/[agentId]/chat</code> route is the
                  primary endpoint for A2A chat.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <A2aOAuthConfig
            agent={agent}
            onUpdate={updateAgentConfig}
            isSaving={isSaving}
          />

          <Card>
            <CardHeader>
              <CardTitle>A2A Endpoint Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your agent's A2A endpoints and their settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {a2aEndpoints.map((endpoint) => (
                <Card key={endpoint.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{endpoint.name}</h4>
                    <Switch
                      checked={endpoint.isEnabled}
                      onCheckedChange={() => {
                        /* TODO: Handle toggle */
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {endpoint.description}
                  </p>
                  <div>
                    <Label htmlFor={`url-${endpoint.id}`} className="text-xs">
                      Endpoint URL
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`url-${endpoint.id}`}
                        value={endpoint.url}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(endpoint.url, `url-${endpoint.id}`)
                        }
                      >
                        {copiedStates[`url-${endpoint.id}`] ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {/* <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add New Endpoint</Button> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated A2A Configuration Files</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use these generated configurations for integrating with other
                platforms.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  Standard A2A Agent JSON
                </Label>
                <Textarea
                  value={generateA2aConfig()}
                  readOnly
                  rows={10}
                  className="text-xs mt-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-xs"
                  onClick={() =>
                    copyToClipboard(generateA2aConfig(), "a2a-json")
                  }
                >
                  {copiedStates["a2a-json"] ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}{" "}
                  Copy JSON
                </Button>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Google Vertex AI Agent Example
                </Label>
                <Textarea
                  value={generateGoogleA2aExample()}
                  readOnly
                  rows={10}
                  className="text-xs mt-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-xs"
                  onClick={() =>
                    copyToClipboard(generateGoogleA2aExample(), "google-json")
                  }
                >
                  {copiedStates["google-json"] ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}{" "}
                  Copy JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Test A2A Endpoint
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  disabled={chatMessages.length === 0 || isTestLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="testEndpointUrl">A2A Endpoint URL</Label>
                  <Input
                    id="testEndpointUrl"
                    value={testEndpointUrl}
                    onChange={(e) => setTestEndpointUrl(e.target.value)}
                    placeholder="e.g., /api/a2a"
                  />
                </div>
                <div>
                  <Label htmlFor="testMessageIdPrefix">Message ID Prefix</Label>
                  <Input
                    id="testMessageIdPrefix"
                    value={testMessageIdPrefix}
                    onChange={(e) => setTestMessageIdPrefix(e.target.value)}
                    placeholder="e.g., chat-session-xyz"
                  />
                </div>
                <div>
                  <Label htmlFor="testContextId">Context ID (Optional)</Label>
                  <Input
                    id="testContextId"
                    value={testContextId}
                    onChange={(e) => setTestContextId(e.target.value)}
                    placeholder="Conversation or session ID"
                  />
                </div>
                <div>
                  <Label htmlFor="testTaskId">Task ID (Optional)</Label>
                  <Input
                    id="testTaskId"
                    value={testTaskId}
                    onChange={(e) => setTestTaskId(e.target.value)}
                    placeholder="Specific task identifier"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/20 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">
                      Start a conversation to test your A2A endpoint.
                    </p>
                    <p className="text-xs mt-1">
                      Messages sent will use the `message/send` method.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg max-w-[85%]",
                        msg.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "mr-auto bg-background border"
                      )}
                    >
                      {msg.role === "agent" && (
                        <Bot className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-grow">
                        {msg.role === "agent" ? (
                          <div className="text-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => (
                                  <h1
                                    {...props}
                                    className="text-2xl font-semibold mt-6 mb-2"
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    {...props}
                                    className="text-xl font-semibold mt-3 mb-1.5"
                                  />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    {...props}
                                    className="text-lg font-semibold mt-2 mb-1"
                                  />
                                ),
                                p: ({ node, ...props }) => (
                                  <p
                                    {...props}
                                    className="mb-2 leading-relaxed"
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    {...props}
                                    className="list-disc list-inside mb-2 pl-4"
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    {...props}
                                    className="list-decimal list-inside mb-2 pl-4"
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li {...props} className="mb-1" />
                                ),
                                a: ({ node, ...props }) => (
                                  <a
                                    {...props}
                                    className="text-primary underline hover:text-primary/80"
                                  />
                                ),
                                code: (
                                  props: React.PropsWithChildren<
                                    React.ComponentPropsWithoutRef<"code"> & {
                                      inline?: boolean;
                                      node?: any;
                                    }
                                  >
                                ) => {
                                  const {
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...rest
                                  } = props;
                                  const match = /language-(\w+)/.exec(
                                    className || ""
                                  );
                                  return !inline && match ? (
                                    <pre
                                      {...rest}
                                      className={`bg-muted p-3 rounded-md overflow-x-auto my-2 ${className || ""}`}
                                    >
                                      <code
                                        {...rest}
                                        className={
                                          match[1] ? `language-${match[1]}` : ""
                                        }
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code
                                      {...rest}
                                      className={`bg-muted text-muted-foreground px-1 py-0.5 rounded-sm ${className || ""}`}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                blockquote: ({ node, ...props }) => (
                                  <blockquote
                                    {...props}
                                    className="border-l-4 border-border pl-4 italic my-3"
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong
                                    {...props}
                                    className="font-semibold"
                                  />
                                ),
                                em: ({ node, ...props }) => (
                                  <em {...props} className="italic" />
                                ),
                                // Add more custom renderers as needed
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.rawResponse && (
                            <span
                              className="ml-2 cursor-pointer underline text-xs"
                              onClick={() => {
                                console.log(
                                  "[A2A Test] Raw response for message:",
                                  msg.id,
                                  msg.rawResponse
                                );
                                alert(
                                  `Raw JSON Response:\n\n${msg.rawResponse}`
                                );
                              }}
                            >
                              (raw)
                            </span>
                          )}
                        </p>
                      </div>
                      {msg.role === "user" && (
                        <User className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTestA2aMessage();
                }}
                className="flex items-center gap-2 pt-4"
              >
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message to the agent..."
                  className="flex-grow resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTestA2aMessage();
                    }
                  }}
                  disabled={isTestLoading}
                />
                <Button
                  type="submit"
                  disabled={
                    isTestLoading ||
                    !chatInput.trim() ||
                    !testEndpointUrl.trim()
                  }
                  size="icon"
                >
                  {isTestLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  General A2A Communication Notes
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    All A2A communication uses JSON-RPC 2.0 over HTTP POST.
                  </li>
                  <li>The `method` field specifies the A2A operation.</li>
                  <li>
                    The `params` field contains the arguments for the method.
                  </li>
                  <li>
                    Your A2A endpoint should implement `message/send` and
                    `agent/card`.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
