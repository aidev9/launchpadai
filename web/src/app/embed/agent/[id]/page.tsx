"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmbeddedAgentChatUI } from "@/app/embed/agent/components/embedded-agent-chat";

interface PublicAgent {
  id: string;
  name: string;
  description: string;
  configuration: {
    isEnabled: boolean;
  };
}

export default function AgentEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "light";
  const hideIcon = searchParams.get("hideIcon") === "true";
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params first
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setAgentId(resolvedParams.id);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return;

      try {
        setIsLoading(true);
        // Fetch agent data from a public API endpoint
        const response = await fetch(`/api/agents/public/${agentId}`);

        if (!response.ok) {
          throw new Error("Agent not found");
        }

        const agentData = await response.json();
        setAgent(agentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading agent...</div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="text-destructive text-lg">⚠️</div>
          <div className="text-destructive font-medium">
            Agent Not Available
          </div>
          <div className="text-sm text-muted-foreground">
            {error ||
              "The requested agent could not be found or is not enabled for public access."}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Agent ID: {agentId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmbeddedAgentChatUI
      agent={agent}
      theme={theme as "light" | "dark"}
      hideIcon={hideIcon}
    />
  );
}
