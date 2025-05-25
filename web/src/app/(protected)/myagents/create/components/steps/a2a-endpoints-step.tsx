"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Mock A2A endpoints data (in a real app, this would come from Firebase)
const mockA2AEndpoints = [
  {
    id: "a2a-1",
    name: "Google Agent2Agent API",
    description:
      "Connect to Google's Agent2Agent API for enhanced reasoning capabilities",
    isEnabled: true,
    authType: "api_key",
    rateLimitPerMinute: 60,
  },
  {
    id: "a2a-2",
    name: "OpenAI Assistant API",
    description: "Connect to OpenAI's Assistant API for specialized tasks",
    isEnabled: true,
    authType: "bearer_token",
    rateLimitPerMinute: 30,
  },
  {
    id: "a2a-3",
    name: "Custom A2A Endpoint",
    description: "User-defined Agent2Agent endpoint for specialized tasks",
    isEnabled: false,
    authType: "api_key",
    rateLimitPerMinute: 100,
  },
];

export function A2aEndpointsStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(
    wizardState?.a2aEndpoints || []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter endpoints based on search query
  const filteredEndpoints = mockA2AEndpoints.filter((endpoint) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      endpoint.name.toLowerCase().includes(query) ||
      endpoint.description.toLowerCase().includes(query)
    );
  });

  // Update the wizard state when selected endpoints change
  useEffect(() => {
    if (wizardState) {
      // Only update if values have changed to prevent unnecessary renders
      if (
        JSON.stringify(wizardState.a2aEndpoints) !==
        JSON.stringify(selectedEndpoints)
      ) {
        setWizardState({
          ...wizardState,
          a2aEndpoints: selectedEndpoints,
        });
      }
    }
  }, [selectedEndpoints, setWizardState]);

  // Toggle endpoint selection
  const toggleEndpoint = (endpointId: string) => {
    if (selectedEndpoints.includes(endpointId)) {
      setSelectedEndpoints(selectedEndpoints.filter((id) => id !== endpointId));
    } else {
      setSelectedEndpoints([...selectedEndpoints, endpointId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Agent2Agent Endpoints</Label>
        <p className="text-sm text-muted-foreground">
          Select Agent2Agent endpoints for your agent to use. These endpoints
          allow your agent to communicate with other agents.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search A2A endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEndpoints.length === 0 ? (
        <div className="p-4 border border-gray-200 rounded-md text-center">
          No Agent2Agent endpoints found. Configure A2A endpoints in the
          Settings section.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEndpoints.map((endpoint) => (
            <Card
              key={endpoint.id}
              className={`cursor-pointer transition-colors ${
                selectedEndpoints.includes(endpoint.id) ? "border-primary" : ""
              }`}
              onClick={() => toggleEndpoint(endpoint.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <Checkbox
                  checked={selectedEndpoints.includes(endpoint.id)}
                  onCheckedChange={() => toggleEndpoint(endpoint.id)}
                  className="mt-1"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{endpoint.name}</h3>
                    <Badge variant={endpoint.isEnabled ? "default" : "outline"}>
                      {endpoint.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {endpoint.description}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      Auth Type: {endpoint.authType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Rate Limit: {endpoint.rateLimitPerMinute}/min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="p-4 border border-blue-200 bg-blue-50 text-blue-800 rounded-md">
        <p className="text-sm">
          <strong>Note:</strong> Agent2Agent endpoints can be configured in the
          Settings section. Make sure your endpoints are properly configured and
          enabled before using them with your agent.
        </p>
      </div>
    </div>
  );
}
