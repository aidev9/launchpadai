"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface GeneralTabProps {
  agent: Agent;
}

export function GeneralTab({ agent }: GeneralTabProps) {
  return (
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
            <div className="text-xs text-muted-foreground">MCP Endpoints</div>
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
            <div className="text-xs text-muted-foreground">Collections</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
