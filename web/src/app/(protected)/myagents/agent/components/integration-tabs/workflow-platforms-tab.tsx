"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users, Workflow, Bot, Zap } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface WorkflowPlatformsTabProps {
  agent: Agent;
  platform: "teams" | "n8n" | "flowise" | "dify";
}

interface PlatformConfig {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
  setupInstructions: string[];
  endpointPath: string;
  endpointLabel: string;
  showWorkflowExample?: boolean;
  additionalConfig?: Array<{ key: string; description: string }>;
}

const platformConfig: Record<string, PlatformConfig> = {
  teams: {
    icon: Users,
    title: "Microsoft Teams Integration",
    description: "Deploy your agent as a Microsoft Teams bot",
    color: "blue",
    setupInstructions: [
      "1. Register your bot in Azure Bot Service",
      "2. Create a Microsoft Teams app manifest",
      "3. Configure the messaging endpoint",
      "4. Upload to Teams or publish to App Store",
    ],
    endpointPath: "/api/integrations/teams",
    endpointLabel: "Messaging Endpoint",
    additionalConfig: [
      { key: "App ID", description: "Azure Bot App ID" },
      { key: "App Password", description: "Azure Bot App Secret" },
    ],
  },
  n8n: {
    icon: Workflow,
    title: "N8N Integration",
    description: "Connect your agent to N8N workflows",
    color: "green",
    setupInstructions: [
      "• Use the HTTP Request node in your N8N workflow",
      "• Configure error handling for robust workflows",
      "• Parse the response to extract the agent's reply",
      "• Consider implementing retry logic for reliability",
    ],
    endpointPath: "/api/agents",
    endpointLabel: "HTTP Request Node Configuration",
    showWorkflowExample: true,
  },
  flowise: {
    icon: Bot,
    title: "Flowise Integration",
    description: "Connect your agent to Flowise chatflows",
    color: "purple",
    setupInstructions: [
      "• Use the API Call node in your Flowise chatflow",
      "• Configure error handling for robust workflows",
      "• Parse the response to extract the agent's reply",
      "• Test the integration before deploying",
    ],
    endpointPath: "/api/agents",
    endpointLabel: "API Call Node Configuration",
  },
  dify: {
    icon: Zap,
    title: "Dify Integration",
    description: "Connect your agent to Dify workflows and applications",
    color: "yellow",
    setupInstructions: [
      "• Add this as a Custom Tool in your Dify application",
      "• Use variable substitution for dynamic inputs",
      "• Configure output parsing to use the response",
      "• Test the integration before deploying",
    ],
    endpointPath: "/api/agents",
    endpointLabel: "HTTP Request Tool Configuration",
  },
};

export function WorkflowPlatformsTab({
  agent,
  platform,
}: WorkflowPlatformsTabProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const config = platformConfig[platform];
  const Icon = config.icon;

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
    if (platform === "teams") {
      return `${baseUrl}${config.endpointPath}/${agent.id}`;
    }
    return `${baseUrl}${config.endpointPath}/${agent.id}`;
  };

  const renderN8NContent = () => (
    <>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-sm mb-2">Method & URL</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                POST
              </span>
              <code className="text-sm">{getEndpointUrl()}</code>
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

      {config.showWorkflowExample && (
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
        "url": "${getEndpointUrl()}",
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
      )}
    </>
  );

  const renderFlowiseContent = () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium text-sm mb-2">Endpoint Configuration</h4>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-muted-foreground">URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 border rounded text-sm bg-muted/30">
                {getEndpointUrl()}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getEndpointUrl(), "flowise-url")}
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
            <label className="text-xs text-muted-foreground">Method</label>
            <div className="p-2 border rounded text-sm bg-muted/30">POST</div>
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
        <h4 className="font-medium text-sm mb-2">Request Body Template</h4>
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
  );

  const renderDifyContent = () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium text-sm mb-2">Tool Settings</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Tool Name</label>
              <div className="p-2 border rounded text-sm bg-muted/30">
                LaunchpadAI Agent
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Method</label>
              <div className="p-2 border rounded text-sm bg-muted/30">POST</div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 border rounded text-sm bg-muted/30">
                {getEndpointUrl()}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getEndpointUrl(), "dify-url")}
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
        <h4 className="font-medium text-sm mb-2">Headers Configuration</h4>
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
        <h4 className="font-medium text-sm mb-2">Response Handling</h4>
        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
          {`{
  "response": "{{response.response}}",
  "metadata": {{response.metadata}}
}`}
        </pre>
      </div>
    </div>
  );

  const renderTeamsContent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{config.endpointLabel}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(getEndpointUrl(), "teams-endpoint")}
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
        <code className="text-sm">{getEndpointUrl()}</code>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Bot Framework Configuration</h3>
        <div className="space-y-2">
          {config.additionalConfig?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded"
            >
              <span className="text-sm font-mono">{item.key}</span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlatformSpecificContent = () => {
    switch (platform) {
      case "n8n":
        return renderN8NContent();
      case "flowise":
        return renderFlowiseContent();
      case "dify":
        return renderDifyContent();
      case "teams":
        return renderTeamsContent();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`p-4 border rounded-lg bg-${config.color}-50 dark:bg-${config.color}-950/30`}
        >
          <h4 className="font-medium text-sm mb-2">
            {platform === "teams" ? "Setup Instructions" : "Integration Tips"}
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {config.setupInstructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>

        {renderPlatformSpecificContent()}
      </CardContent>
    </Card>
  );
}
