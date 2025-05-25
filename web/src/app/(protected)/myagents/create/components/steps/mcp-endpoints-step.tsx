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
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseMcpEndpoints } from "@/lib/firebase/client/FirebaseMcpEndpoints";
import { McpEndpointConfig } from "@/lib/firebase/schema/mcp-endpoints";
import { Skeleton } from "@/components/ui/skeleton";

export function McpEndpointsStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(
    wizardState?.mcpEndpoints || []
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch MCP endpoints from Firebase
  // Note: In a real implementation, you would need to fetch endpoints for the current user
  // This is a simplified version that assumes endpoints are stored in a collection
  const [endpoints, isLoading, error] = useCollectionData(
    firebaseMcpEndpoints.getRefCollection(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format endpoints data
  const formattedEndpoints = (endpoints || []).map((endpoint) => {
    return {
      ...endpoint,
      id: endpoint.id,
    } as McpEndpointConfig;
  });

  // Filter endpoints based on search query
  const filteredEndpoints = formattedEndpoints.filter((endpoint) => {
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
        JSON.stringify(wizardState.mcpEndpoints) !==
        JSON.stringify(selectedEndpoints)
      ) {
        setWizardState({
          ...wizardState,
          mcpEndpoints: selectedEndpoints,
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
        <Label>MCP Endpoints</Label>
        <p className="text-sm text-muted-foreground">
          Select MCP endpoints for your agent to use. These endpoints allow your
          agent to access external services.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search endpoints..."
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
      ) : error ? (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          Error loading MCP endpoints: {error.message}
        </div>
      ) : filteredEndpoints.length === 0 ? (
        <div className="p-4 border border-gray-200 rounded-md text-center">
          No MCP endpoints found. Configure MCP endpoints in the Settings
          section.
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
                      Rate Limit: {endpoint.accessControl.rateLimitPerMinute}
                      /min
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
          <strong>Note:</strong> MCP endpoints can be configured in the Settings
          section. Make sure your endpoints are properly configured and enabled
          before using them with your agent.
        </p>
      </div>
    </div>
  );
}
