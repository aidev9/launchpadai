"use client";

import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function ReviewStep() {
  const [wizardState] = useAtom(agentWizardStateAtom);

  if (!wizardState) {
    return <div>No agent data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* <div className="space-y-2">
        <h3 className="text-lg font-medium">Review Your Agent</h3>
        <p className="text-sm text-muted-foreground">
          Review your agent configuration before creating it.
        </p>
      </div> */}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <h4 className="font-medium">Basic Information</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Name:</div>
              <div className="text-sm">
                {wizardState.name || "Not specified"}
              </div>

              <div className="text-sm text-muted-foreground">Description:</div>
              <div className="text-sm">
                {wizardState.description || "Not specified"}
              </div>

              <div className="text-sm text-muted-foreground">Phases:</div>
              <div className="flex flex-wrap gap-1">
                {wizardState.phases && wizardState.phases.length > 0 ? (
                  wizardState.phases.map((phase, index) => (
                    <Badge key={`phase-${index}-${phase}`} variant="outline">
                      {phase}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm">None selected</span>
                )}
              </div>

              <div className="text-sm text-muted-foreground">Tags:</div>
              <div className="flex flex-wrap gap-1">
                {wizardState.tags && wizardState.tags.length > 0 ? (
                  wizardState.tags.map((tag, index) => (
                    <Badge key={`tag-${index}-${tag}`} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm">None added</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium">System Prompt</h4>
            <div className="mt-2">
              {wizardState.systemPrompt ? (
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {wizardState.systemPrompt.length > 300
                      ? wizardState.systemPrompt.substring(0, 300) + "..."
                      : wizardState.systemPrompt}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No system prompt configured
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium">Knowledge Base</h4>
            <div className="mt-2">
              <div className="text-sm text-muted-foreground mb-1">
                Collections:
              </div>
              {wizardState.collections && wizardState.collections.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {wizardState.collections.map((collectionId, index) => (
                    <Badge
                      key={`collection-${index}-${collectionId}`}
                      variant="outline"
                    >
                      {collectionId}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm">No collections selected</div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium">Tools and Endpoints</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Tools:</div>
              <div>
                {wizardState.tools && wizardState.tools.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wizardState.tools.map((toolId, index) => (
                      <Badge key={`tool-${index}-${toolId}`} variant="outline">
                        {toolId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">No tools selected</span>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                MCP Endpoints:
              </div>
              <div>
                {wizardState.mcpEndpoints &&
                wizardState.mcpEndpoints.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wizardState.mcpEndpoints.map((endpointId, index) => (
                      <Badge
                        key={`mcp-${index}-${endpointId}`}
                        variant="outline"
                      >
                        {endpointId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">No MCP endpoints selected</span>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                A2A Endpoints:
              </div>
              <div>
                {wizardState.a2aEndpoints &&
                wizardState.a2aEndpoints.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wizardState.a2aEndpoints.map((endpointId, index) => (
                      <Badge
                        key={`a2a-${index}-${endpointId}`}
                        variant="outline"
                      >
                        {endpointId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">No A2A endpoints selected</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium">Configuration</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Status:</div>
              <div>
                {wizardState.configuration?.isEnabled ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
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

              <div className="text-sm text-muted-foreground">URL Path:</div>
              <div className="text-sm">
                {wizardState.configuration?.url ? (
                  <code className="bg-muted px-1 py-0.5 rounded">
                    /api/agents/{wizardState.configuration.url}
                  </code>
                ) : (
                  "Not specified"
                )}
              </div>

              <div className="text-sm text-muted-foreground">API Key:</div>
              <div className="text-sm">
                {wizardState.configuration?.apiKey ? "Set" : "Not set"}
              </div>

              <div className="text-sm text-muted-foreground">Rate Limit:</div>
              <div className="text-sm">
                {wizardState.configuration?.rateLimitPerMinute || 60} requests
                per minute
              </div>

              <div className="text-sm text-muted-foreground">
                IP Restrictions:
              </div>
              <div>
                {wizardState.configuration?.allowedIps &&
                wizardState.configuration.allowedIps.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wizardState.configuration.allowedIps.map((ip, index) => (
                      <Badge key={`ip-${index}-${ip}`} variant="secondary">
                        {ip}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">No restrictions (open to all)</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <div className="flex justify-center">
        <Button onClick={onSubmit} className="w-full max-w-xs">
          Create Agent
        </Button>
      </div> */}
    </div>
  );
}
