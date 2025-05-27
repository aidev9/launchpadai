"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";
import { EndpointInfo } from "./api-components/endpoint-info";
import { SecuritySettings } from "./api-components/security-settings";
import { RateLimiting } from "./api-components/rate-limiting";
import { ApiTesting } from "./api-components/api-testing";
import { CommandExamples } from "./api-components/command-examples";
import { ApiSchema } from "./api-components/api-schema";

interface ApiTabProps {
  agent: Agent;
}

export function ApiTab({ agent }: ApiTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Derive current configuration from agent (reactive to changes)
  const currentConfig = {
    authType: agent.configuration.apiKey
      ? agent.configuration.authType || "apikey"
      : ("none" as "bearer" | "apikey" | "none"),
    responseType:
      agent.configuration.responseType || ("single" as "streaming" | "single"),
    rateLimit: agent.configuration.rateLimitPerMinute || 100,
    ipWhitelist: agent.configuration.allowedIps?.join(", ") || "",
    ipWhitelistEnabled: (agent.configuration.allowedIps?.length || 0) > 0,
    apiKey: agent.configuration.apiKey || "",
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
          description: "API configuration saved successfully",
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
            : "Failed to save API configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="h-5 w-5" />
            REST API Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure and test your agent's API endpoint for custom integrations
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <EndpointInfo agent={agent} />

          <SecuritySettings
            agent={agent}
            currentConfig={currentConfig}
            onUpdate={updateAgentConfig}
            isSaving={isSaving}
          />

          <RateLimiting
            agent={agent}
            currentConfig={currentConfig}
            onUpdate={updateAgentConfig}
          />
        </div>

        {/* Right Column: Testing */}
        <div className="space-y-6">
          <ApiTesting agent={agent} currentConfig={currentConfig} />
        </div>
      </div>

      {/* Command Examples */}
      <CommandExamples agent={agent} currentConfig={currentConfig} />

      {/* API Schema */}
      <ApiSchema currentConfig={currentConfig} />
    </div>
  );
}
