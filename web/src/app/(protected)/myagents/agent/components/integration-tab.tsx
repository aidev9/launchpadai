"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
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
import {
  GeneralTab,
  IFrameTab,
  ReactTab,
  HtmlTab,
  ApiTab,
  McpTab,
  A2aTab,
  SlackTab,
  WorkflowPlatformsTab,
} from "./integration-tabs";

interface IntegrationTabProps {
  agent: Agent;
}

export function IntegrationTab({ agent }: IntegrationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("general");

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
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span className="hidden lg:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            <span className="hidden lg:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="mcp" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className="hidden lg:inline">MCP</span>
          </TabsTrigger>
          <TabsTrigger value="a2a" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            <span className="hidden lg:inline">A2A</span>
          </TabsTrigger>
          <TabsTrigger value="iframe" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden lg:inline">IFrame</span>
          </TabsTrigger>

          {/* <TabsTrigger value="react" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="hidden lg:inline">React</span>
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden lg:inline">HTML</span>
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
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <GeneralTab agent={agent} />
        </TabsContent>

        <TabsContent value="iframe" className="space-y-4 mt-4">
          <IFrameTab agent={agent} />
        </TabsContent>

        <TabsContent value="react" className="space-y-4 mt-4">
          <ReactTab agent={agent} />
        </TabsContent>

        <TabsContent value="html" className="space-y-4 mt-4">
          <HtmlTab agent={agent} />
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <ApiTab agent={agent} />
        </TabsContent>

        <TabsContent value="mcp" className="space-y-4 mt-4">
          <McpTab agent={agent} />
        </TabsContent>

        <TabsContent value="a2a" className="space-y-4 mt-4">
          <A2aTab agent={agent} />
        </TabsContent>

        <TabsContent value="slack" className="space-y-4 mt-4">
          <SlackTab agent={agent} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4 mt-4">
          <WorkflowPlatformsTab agent={agent} platform="teams" />
        </TabsContent>

        <TabsContent value="n8n" className="space-y-4 mt-4">
          <WorkflowPlatformsTab agent={agent} platform="n8n" />
        </TabsContent>

        <TabsContent value="flowise" className="space-y-4 mt-4">
          <WorkflowPlatformsTab agent={agent} platform="flowise" />
        </TabsContent>

        <TabsContent value="dify" className="space-y-4 mt-4">
          <WorkflowPlatformsTab agent={agent} platform="dify" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
