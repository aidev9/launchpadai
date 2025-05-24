"use client";

import { useState, useEffect } from "react";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McpEndpointConfig } from "@/lib/firebase/schema/mcp-endpoints";
import { McpEndpointForm } from "./mcp-endpoint-form";
import { McpEndpointCard } from "./mcp-endpoint-card";
import { McpTestPanel } from "./mcp-test-panel";
import { McpBrowserTest } from "./mcp-browser-test";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { firebaseMcpEndpoints } from "@/lib/firebase/client/FirebaseMcpEndpoints";

interface McpTabProps {
  collectionId: string;
}

export function McpTab({ collectionId }: McpTabProps) {
  const [endpoints, setEndpoints] = useState<McpEndpointConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [endpointToEdit, setEndpointToEdit] = useState<
    McpEndpointConfig | undefined
  >(undefined);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<McpEndpointConfig | null>(null);
  const [activeSubTab, setActiveSubTab] = useState("endpoints");
  const { toast } = useToast();

  // Fetch MCP endpoints for this collection
  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        setIsLoading(true);
        const result =
          await firebaseMcpEndpoints.getMcpEndpointConfigsByCollection(
            collectionId
          );
        if (result.success) {
          setEndpoints(result.endpoints || []);
          // Select the first endpoint for testing if available
          if (result.endpoints && result.endpoints.length > 0) {
            setSelectedEndpoint(result.endpoints[0]);
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch MCP endpoints",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEndpoints();
  }, [collectionId, toast]);

  const handleEndpointCreated = (endpoint: McpEndpointConfig) => {
    setEndpoints((prev) => [...prev, endpoint]);
    setIsFormOpen(false);
    // Select the newly created endpoint
    setSelectedEndpoint(endpoint);
  };

  const handleEndpointUpdated = (endpoint: McpEndpointConfig) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === endpoint.id ? endpoint : e))
    );
    setIsFormOpen(false);
    setEndpointToEdit(undefined);
    // Update selected endpoint if it was the one being edited
    if (selectedEndpoint && selectedEndpoint.id === endpoint.id) {
      setSelectedEndpoint(endpoint);
    }
  };

  const handleEndpointDeleted = (endpointId: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== endpointId));
    // Clear selected endpoint if it was deleted
    if (selectedEndpoint && selectedEndpoint.id === endpointId) {
      setSelectedEndpoint(null);
    }
  };

  const refreshEndpoints = async () => {
    try {
      setIsLoading(true);
      const result =
        await firebaseMcpEndpoints.getMcpEndpointConfigsByCollection(
          collectionId
        );
      if (result.success) {
        setEndpoints(result.endpoints || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to refresh MCP endpoints",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TabsContent value="mcp" className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">MCP Endpoints</h2>
          <p className="text-muted-foreground">
            Create and manage MCP endpoints for external agents to access this
            collection
          </p>
        </div>
      </div>

      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="test" disabled={!selectedEndpoint}>
            Test
          </TabsTrigger>
          <TabsTrigger value="ai-test" disabled={!selectedEndpoint}>
            AI Test
          </TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Endpoint
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : endpoints.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No MCP endpoints yet</h3>
              <p className="text-muted-foreground mb-6">
                Create an MCP endpoint to allow external agents to search this
                collection
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Endpoint
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoints.map((endpoint) => (
                <McpEndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  onEdit={() => {
                    setEndpointToEdit(endpoint);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleEndpointDeleted}
                  onSelect={() => {
                    setSelectedEndpoint(endpoint);
                    setActiveSubTab("test");
                  }}
                  isSelected={selectedEndpoint?.id === endpoint.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          {selectedEndpoint ? (
            <McpTestPanel endpoint={selectedEndpoint} />
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No endpoint selected</h3>
              <p className="text-muted-foreground mb-6">
                Please select an endpoint to test
              </p>
              <Button onClick={() => setActiveSubTab("endpoints")}>
                Go to Endpoints
              </Button>
            </div>
          )}
        </TabsContent>

        {/* AI Test Tab */}
        <TabsContent value="ai-test" className="space-y-4">
          {selectedEndpoint ? (
            <McpBrowserTest endpoint={selectedEndpoint} />
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No endpoint selected</h3>
              <p className="text-muted-foreground mb-6">
                Please select an endpoint to test with AI
              </p>
              <Button onClick={() => setActiveSubTab("endpoints")}>
                Go to Endpoints
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isFormOpen && (
        <McpEndpointForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEndpointToEdit(undefined);
          }}
          collectionId={collectionId}
          endpointToEdit={endpointToEdit}
          onCreated={handleEndpointCreated}
          onUpdated={handleEndpointUpdated}
        />
      )}
    </TabsContent>
  );
}
