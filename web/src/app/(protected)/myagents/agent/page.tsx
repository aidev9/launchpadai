"use client";

import { useState } from "react";
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
  Pencil,
  Trash2,
  Bot,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AgentChatPanel } from "./components/agent-chat-panel";
import { IntegrationTab } from "./components/integration-tab";
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

  // System prompt accordion state
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

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
    router.push("/myagents");
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
    if (!testMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test message",
        variant: "destructive",
      });
      return;
    }

    if (!agent?.id) {
      toast({
        title: "Error",
        description: "No agent selected",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResponse("");

    try {
      const response = await fetch("/api/agents/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agent.id,
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test agent");
      }

      setTestResponse(data.response);

      toast({
        title: "Success",
        description: "Test completed successfully",
      });
    } catch (error) {
      console.error("Error testing agent:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to test agent",
        variant: "destructive",
      });
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
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Agent not found</h2>
          <p className="text-muted-foreground mt-2">
            The agent you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/myagents")} className="mt-4">
            Back to My Agents
          </Button>
        </div>
      </Main>
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
          <Card>
            <CardHeader>
              <CardTitle>Test Your Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Prompt Preview */}
              {agent.systemPrompt && (
                <div className="space-y-2">
                  <Label>System Prompt (Preview)</Label>
                  <div className="p-3 border rounded-md bg-muted/50 text-sm">
                    <p className="text-muted-foreground line-clamp-3">
                      {agent.systemPrompt}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="test-message">Message</Label>
                <textarea
                  id="test-message"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  placeholder="Enter a message to test your agent..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  disabled={isTesting}
                />
              </div>

              <Button
                onClick={handleTestAgent}
                disabled={isTesting || !agent.configuration.isEnabled}
                className="w-full"
              >
                {isTesting ? "Testing..." : "Test Agent"}
              </Button>

              {!agent.configuration.isEnabled && (
                <p className="text-sm text-amber-600">
                  You need to enable the agent before testing it.
                </p>
              )}

              {testResponse && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium">Response:</h3>
                  <div className="p-4 border rounded-md bg-muted">
                    <p className="whitespace-pre-wrap">{testResponse}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>✓ Response generated using agent's system prompt</p>
                    <p>✓ Model: GPT-4o Mini</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
