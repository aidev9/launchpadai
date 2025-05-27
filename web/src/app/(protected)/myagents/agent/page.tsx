"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAtom, useSetAtom } from "jotai";
import {
  selectedAgentAtom,
  agentWizardStateAtom,
  isEditModeAtom,
  currentWizardStepAtom,
} from "@/lib/store/agent-store";
import { Agent } from "@/lib/firebase/schema";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";
import { useDocumentData } from "react-firebase-hooks/firestore";
import {
  Bot,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TestTube,
  AlertCircle,
  Send,
  User,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { AgentChatPanel } from "./components/agent-chat-panel";
import { IntegrationTab } from "./components/integration-tab";
import { ToolsAccordion, ToolCall } from "./components/tools-accordion";
import {
  CollectionsAccordion,
  KnowledgeSearchResult,
} from "./components/collections-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AgentDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useAtom(selectedAgentAtom);
  const setWizardState = useSetAtom(agentWizardStateAtom);
  const setIsEditMode = useSetAtom(isEditModeAtom);
  const setCurrentWizardStep = useSetAtom(currentWizardStepAtom);

  // Use Firebase hook to get agent data
  const agentRef = selectedAgent?.id
    ? firebaseAgents.getRefDocument(selectedAgent.id)
    : null;
  const [agent, isLoading, error] = useDocumentData(agentRef);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Test message state
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testToolCalls, setTestToolCalls] = useState<ToolCall[]>([]);
  const [testKnowledgeSearchResults, setTestKnowledgeSearchResults] = useState<
    KnowledgeSearchResult[]
  >([]);

  // System prompt accordion state
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

  // Handle navigation when no agent is selected
  useEffect(() => {
    if (!selectedAgent?.id) {
      router.push("/myagents");
    }
  }, [selectedAgent?.id, router]);

  // Handle Firebase errors
  if (error) {
    return (
      <Main>
        <ErrorDisplay
          error={error}
          title="Agent rockets are offline!"
          message="Our agent loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Retry Launch"
          component="AgentDetail"
          action="loading_agent_data"
          metadata={{ agentId: selectedAgent?.id }}
        />
      </Main>
    );
  }

  if (!selectedAgent?.id) {
    return null;
  }

  // Handle edit agent
  const handleEditAgent = () => {
    if (!agent) return;

    // Set up the wizard state for editing
    setWizardState(agent);
    setIsEditMode(true);
    setCurrentWizardStep(1); // Start from the first step

    // Navigate to the wizard
    router.push("/myagents/create");
  };

  // Handle delete agent
  const handleDeleteAgent = async () => {
    if (!agent?.id) return;

    try {
      const result = await firebaseAgents.deleteAgent(agent.id);
      if (result) {
        toast({
          title: "Success",
          description: "Agent deleted successfully",
        });
        router.push("/myagents");
      } else {
        toast({
          title: "Error",
          description: "Failed to delete agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the agent",
        variant: "destructive",
      });
    }

    setIsDeleteDialogOpen(false);
  };

  // Handle toggle agent enabled state
  const handleToggleEnabled = async () => {
    if (!agent?.id) return;

    setIsEnabling(true);

    try {
      const updatedAgent = {
        ...agent,
        configuration: {
          ...agent.configuration,
          isEnabled: !agent.configuration.isEnabled,
        },
      };

      const result = await firebaseAgents.updateAgent(updatedAgent);

      if (result) {
        // Firebase hook will automatically update the agent data
        toast({
          title: "Success",
          description: `Agent ${updatedAgent.configuration.isEnabled ? "enabled" : "disabled"} successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update agent status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating agent status",
        variant: "destructive",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Handle test agent
  const handleTestAgent = async () => {
    if (!testMessage.trim()) return;
    if (!agent) return;

    setIsTesting(true);
    setTestResponse("");
    setTestToolCalls([]);
    setTestKnowledgeSearchResults([]);

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: testMessage }],
          agentId: agent.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to test agent");
      }

      const data = await response.json();

      // Handle tool calls if present
      if (data.toolCalls && data.toolCalls.length > 0) {
        const toolCallsForDisplay: ToolCall[] = data.toolCalls.map(
          (toolCall: any) => ({
            id: toolCall.toolCallId || `tool-${Date.now()}-${Math.random()}`,
            toolName: toolCall.toolName,
            parameters: toolCall.args || {},
            result: toolCall.result,
            status: "success",
            timestamp: new Date(),
            duration: 0,
          })
        );
        setTestToolCalls(toolCallsForDisplay);

        // Extract knowledge search results
        const knowledgeSearchCalls = data.toolCalls.filter(
          (toolCall: any) => toolCall.toolName === "search_knowledge"
        );

        if (knowledgeSearchCalls.length > 0) {
          const newKnowledgeResults: KnowledgeSearchResult[] =
            knowledgeSearchCalls.map((toolCall: any) => ({
              id: `knowledge-${Date.now()}-${Math.random()}`,
              query: toolCall.args?.query || "Unknown query",
              results: toolCall.result?.results || [],
              timestamp: new Date(),
            }));
          setTestKnowledgeSearchResults(newKnowledgeResults);
        }
      }

      setTestResponse(data.text || data.response || "No response");
    } catch (error) {
      console.error("Test error:", error);
      setTestResponse(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Main>
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Main>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Agent not found</h2>
          <p className="text-muted-foreground">
            The agent you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Main>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: "My Agents", href: "/myagents" },
            { label: agent.name, isCurrentPage: true },
          ]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {agent.name}
              </h1>
              {agent.configuration.isEnabled ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-300"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>

          <div className="flex space-x-2 self-end md:self-auto">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
            <Button
              onClick={handleEditAgent}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <div className="flex items-center mt-1">
                    <Switch
                      checked={agent.configuration.isEnabled}
                      onCheckedChange={handleToggleEnabled}
                      disabled={isEnabling}
                      id="agent-status"
                    />
                    <Label htmlFor="agent-status" className="ml-2">
                      {agent.configuration.isEnabled ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    API Endpoint
                  </h3>
                  <p className="mt-1">
                    {agent.configuration.url ? (
                      <code className="bg-muted px-1 py-0.5 rounded">
                        /api/agents/{agent.configuration.url}
                      </code>
                    ) : (
                      "Not configured"
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Phases
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.phases && agent.phases.length > 0 ? (
                    agent.phases.map((phase) => (
                      <Badge key={phase} variant="outline">
                        {phase}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">No phases</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.tags && agent.tags.length > 0 ? (
                    agent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">No tags</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt Card */}
          {agent.systemPrompt && (
            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-md bg-muted/50 text-sm">
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isSystemPromptExpanded ? "max-h-[1000px]" : "max-h-24"
                      }`}
                    >
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {isSystemPromptExpanded
                          ? agent.systemPrompt
                          : `${agent.systemPrompt.substring(0, 300)}${agent.systemPrompt.length > 300 ? "..." : ""}`}
                      </p>
                    </div>
                  </div>

                  {agent.systemPrompt.length > 300 && (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setIsSystemPromptExpanded(!isSystemPromptExpanded)
                        }
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="system-prompt-toggle"
                      >
                        {isSystemPromptExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                            View Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            Expand
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Collections
                </h3>
                <div className="mt-2">
                  {agent.collections && agent.collections.length > 0 ? (
                    <ul className="space-y-1">
                      {agent.collections.map((collectionId) => (
                        <li key={collectionId} className="text-sm">
                          {collectionId}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No collections selected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tools & Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tools
                  </h3>
                  <div className="mt-1">
                    {agent.tools && agent.tools.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map((toolId) => (
                          <Badge key={toolId} variant="outline">
                            {toolId}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">No tools selected</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    MCP Endpoints
                  </h3>
                  <div className="mt-1">
                    {agent.mcpEndpoints && agent.mcpEndpoints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.mcpEndpoints.map((endpointId) => (
                          <Badge key={endpointId} variant="outline">
                            {endpointId}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">No MCP endpoints selected</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    A2A Endpoints
                  </h3>
                  <div className="mt-1">
                    {agent.a2aEndpoints && agent.a2aEndpoints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.a2aEndpoints.map((endpointId) => (
                          <Badge key={endpointId} variant="outline">
                            {endpointId}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">No A2A endpoints selected</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    API Endpoint
                  </h3>
                  <p className="mt-1">
                    {agent.configuration.url ? (
                      <code className="bg-muted px-1 py-0.5 rounded">
                        /api/agents/{agent.configuration.url}
                      </code>
                    ) : (
                      "Not configured"
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    API Key
                  </h3>
                  <p className="mt-1">
                    {agent.configuration.apiKey ? (
                      <code className="bg-muted px-1 py-0.5 rounded">
                        {agent.configuration.apiKey.substring(0, 8)}...
                      </code>
                    ) : (
                      "Not set"
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Rate Limit
                  </h3>
                  <p className="mt-1">
                    {agent.configuration.rateLimitPerMinute || 60} requests per
                    minute
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    IP Restrictions
                  </h3>
                  <div className="mt-1">
                    {agent.configuration.allowedIps &&
                    agent.configuration.allowedIps.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.configuration.allowedIps.map((ip) => (
                          <Badge key={ip} variant="secondary">
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">No restrictions (open to all)</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  HTTP Request
                </h3>
                <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto text-sm">
                  {`POST /api/agents/${agent.configuration.url || "[agent-url]"}
Content-Type: application/json
Authorization: Bearer ${agent.configuration.apiKey || "[your-api-key]"}

{
  "message": "Your message to the agent",
  "context": {
    "user": "user123",
    "conversation_id": "conv456"
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Example Response
                </h3>
                <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto text-sm">
                  {`{
  "response": "This is a response from the agent",
  "metadata": {
    "agent_id": "${agent.id}",
    "timestamp": "2025-05-24T18:15:00Z",
    "tools_used": ["search", "calculator"]
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4 mt-4">
          <IntegrationTab agent={agent} />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4 mt-4">
          <AgentChatPanel agent={agent} />
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4 mt-4">
          <div className="space-y-6">
            {/* Agent Info Header */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 w-48">
                      <CardTitle className="text-base truncate">
                        Test {agent.name}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Test your agent's capabilities and responses
                    </p>
                  </div>
                  {/* System Prompt in the middle */}
                  {agent.systemPrompt && (
                    <div className="text-xs text-muted-foreground p-2 rounded w-[75%]">
                      <strong className="text-sm text-black">
                        System Prompt:
                      </strong>{" "}
                      <div className="truncate">{agent.systemPrompt}</div>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Tools and Collections */}
              <div className="space-y-6">
                {/* Tools Accordion */}
                <ToolsAccordion toolCalls={testToolCalls} />

                {/* Collections Accordion */}
                <CollectionsAccordion
                  agent={agent}
                  searchResults={testKnowledgeSearchResults}
                />
              </div>

              {/* Right Column: Test Interface */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex flex-row gap-2 justify-between">
                      <span className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        {agent.name}
                      </span>
                      <div>
                        {isTesting && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 text-xs w-24 h-8 justify-center"
                          >
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            <span>Testing...</span>
                          </Badge>
                        )}

                        {!isTesting && (
                          <Badge
                            variant={
                              agent.configuration.isEnabled
                                ? "default"
                                : "secondary"
                            }
                            className={
                              agent.configuration.isEnabled
                                ? "bg-green-100 text-green-800 text-xs w-24 h-8 justify-center"
                                : "text-xs w-24 h-6 justify-center"
                            }
                          >
                            {agent.configuration.isEnabled
                              ? "Online"
                              : "Offline"}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!agent.configuration.isEnabled && (
                      <Alert>
                        <div className="flex items-center gap-2 pb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Agent Disabled</AlertTitle>
                        </div>
                        <AlertDescription>
                          This agent is currently disabled. Enable it in the
                          General tab to start testing.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Test messages area */}
                    <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto bg-muted/20">
                      {!testResponse ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <TestTube className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            Test your agent
                          </h3>
                          <p className="text-muted-foreground mb-4 max-w-md">
                            Send a test message to {agent.name} to see how it
                            responds. The agent will use its configured system
                            prompt
                            {agent.collections &&
                              agent.collections.length > 0 &&
                              ` and has access to ${agent.collections.length} knowledge collection${agent.collections.length !== 1 ? "s" : ""}`}
                            .
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* User Message */}
                          <div className="flex justify-end">
                            <div className="flex items-start gap-2 max-w-[80%] flex-row-reverse">
                              {/* Avatar */}
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                                <User className="h-4 w-4" />
                              </div>
                              {/* Message Bubble */}
                              <div className="relative group rounded-lg p-3 bg-primary text-primary-foreground">
                                <div className="text-sm whitespace-pre-wrap">
                                  {testMessage}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Agent Response */}
                          <div className="flex justify-start">
                            <div className="flex items-start gap-2 max-w-[80%] flex-row">
                              {/* Avatar */}
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                                <Bot className="h-4 w-4" />
                              </div>
                              {/* Message Bubble */}
                              <div className="relative group rounded-lg p-3 bg-background border">
                                <div className="text-sm whitespace-pre-wrap">
                                  {testResponse}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Test Info */}
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            <p>
                              ✓ Response generated using agent's system prompt
                            </p>
                            <p>✓ Model: GPT-4o Mini</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input form */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <textarea
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          placeholder={
                            agent.configuration.isEnabled
                              ? `Test message for ${agent.name}...`
                              : "Agent is disabled"
                          }
                          disabled={isTesting || !agent.configuration.isEnabled}
                          className="flex-1 px-3 pt-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (
                                !isTesting &&
                                agent.configuration.isEnabled &&
                                testMessage.trim()
                              ) {
                                handleTestAgent();
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={handleTestAgent}
                          disabled={
                            isTesting ||
                            !testMessage.trim() ||
                            !agent.configuration.isEnabled
                          }
                          className="self-end"
                        >
                          {isTesting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
