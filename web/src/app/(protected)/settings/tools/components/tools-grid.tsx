"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Check,
  X,
  Clock,
  Key,
  Wrench,
  Globe,
  Cloud,
  Newspaper,
  Brain,
  Map,
  Calendar,
  Languages,
} from "lucide-react";
import { toolsConfig } from "../data/tools-config";
import { ToolConfig } from "../types";
import { ToolConfigDialog } from "./tool-config-dialog";
import {
  firebaseTools,
  ToolConfiguration,
} from "@/lib/firebase/client/FirebaseTools";
import { useAction } from "next-safe-action/hooks";

// Category icons mapping
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Search: Globe,
  Weather: Cloud,
  News: Newspaper,
  Utility: Wrench,
  Knowledge: Brain,
  Navigation: Map,
  Productivity: Calendar,
  Language: Languages,
};

export function ToolsGrid() {
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);

  // Fetch tool configurations from Firebase
  const [toolConfigsSnapshot, loading, error] = useCollection(
    firebaseTools.getToolConfigurations()
  );

  // Merge static tool configs with Firebase configurations
  const mergedTools = useMemo(() => {
    const firebaseConfigs: Record<string, ToolConfiguration> = {};

    if (toolConfigsSnapshot) {
      console.log(
        "[ToolsGrid] Firebase configs found:",
        toolConfigsSnapshot.docs.length
      );
      toolConfigsSnapshot.docs.forEach((doc) => {
        const config = doc.data() as ToolConfiguration;
        console.log("[ToolsGrid] Config for tool:", config.toolId, config);
        firebaseConfigs[config.toolId] = config;
      });
    } else {
      console.log("[ToolsGrid] No Firebase configs found");
    }

    return toolsConfig.map((staticTool) => {
      const firebaseConfig = firebaseConfigs[staticTool.id];

      if (firebaseConfig) {
        console.log(
          "[ToolsGrid] Merging config for tool:",
          staticTool.id,
          firebaseConfig
        );
        const mergedTool = {
          ...staticTool,
          isEnabled: firebaseConfig.isEnabled,
          apiKey: firebaseConfig.apiKey,
          testStatus: firebaseConfig.testStatus || "never",
          testMessage: firebaseConfig.testMessage,
          tested: firebaseConfig.tested || false,
          lastTested: firebaseConfig.lastTested
            ? new Date(firebaseConfig.lastTested)
            : undefined,
        } as ToolConfig;
        console.log("[ToolsGrid] Merged tool result:", mergedTool);
        return mergedTool;
      }

      return staticTool;
    });
  }, [toolConfigsSnapshot]);

  // Group tools by category
  const categories = Array.from(
    new Set(mergedTools.map((tool) => tool.category))
  );
  const toolsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = mergedTools.filter((tool) => tool.category === category);
      return acc;
    },
    {} as Record<string, ToolConfig[]>
  );

  const handleToolToggle = async (toolId: string, enabled: boolean) => {
    try {
      const tool = mergedTools.find((t) => t.id === toolId);
      if (!tool) return;

      // Import the server action
      const { saveToolConfig } = await import("../actions");

      await saveToolConfig({
        toolId,
        isEnabled: enabled,
        apiKey: tool.apiKey,
        config: {},
      });
    } catch (error) {
      console.error("Failed to toggle tool:", error);
    }
  };

  const handleToolUpdate = (updatedTool: ToolConfig) => {
    setSelectedTool(null);
    // The component will automatically update via Firebase hooks
  };

  const getStatusIcon = (tool: ToolConfig) => {
    if (!tool.apiKeyRequired) {
      return <Check className="h-4 w-4 text-green-600" />;
    }

    if (!tool.tested) {
      return tool.apiKey ? (
        <Clock className="h-4 w-4 text-gray-400" />
      ) : (
        <Key className="h-4 w-4 text-gray-400" />
      );
    }

    switch (tool.testStatus) {
      case "success":
        return <Check className="h-4 w-4 text-green-600" />;
      case "error":
        return <X className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (tool: ToolConfig) => {
    console.log(`[ToolsGrid] getStatusText for ${tool.id}:`, {
      apiKeyRequired: tool.apiKeyRequired,
      apiKey: !!tool.apiKey,
      testStatus: tool.testStatus,
      tested: tool.tested,
      lastTested: tool.lastTested,
    });

    if (!tool.apiKeyRequired) {
      return "Ready";
    }

    if (!tool.apiKey) {
      return "Not configured";
    }

    // Use the tested field to determine if the tool has been tested
    if (!tool.tested) {
      return "Not tested";
    }

    switch (tool.testStatus) {
      case "success":
        return "Connected";
      case "error":
        return "Connection failed";
      case "pending":
        return "Testing...";
      default:
        return "Not tested";
    }
  };

  const getStatusColor = (tool: ToolConfig) => {
    if (!tool.apiKeyRequired) {
      return "bg-green-100 text-green-800 border-green-200";
    }

    if (!tool.apiKey) {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }

    if (!tool.tested) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    switch (tool.testStatus) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading tools...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading tool configurations:", error);
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(toolsByCategory).map(
          ([category, categoryTools], categoryIndex) => {
            const CategoryIcon = categoryIcons[category] || Wrench;

            return (
              <div key={category} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {categoryTools.length} tool
                      {categoryTools.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {categoryTools.filter((t) => t.isEnabled).length} enabled
                  </Badge>
                </div>

                {/* Tools List - One per row */}
                <div className="space-y-4">
                  {categoryTools.map((tool) => {
                    const ToolIcon = tool.icon;

                    return (
                      <Card
                        key={tool.id}
                        className={`transition-all duration-200 hover:shadow-md ${
                          tool.isEnabled
                            ? "border-primary/20 bg-primary/5 shadow-sm"
                            : "border-border"
                        }`}
                        data-testid={`tool-config-${tool.id}`}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Tool Icon */}
                              <div
                                className={`p-3 rounded-lg transition-colors ${
                                  tool.isEnabled
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <ToolIcon className="h-5 w-5" />
                              </div>

                              {/* Tool Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <CardTitle className="text-lg font-semibold">
                                    {tool.name}
                                  </CardTitle>
                                  {tool.apiKeyRequired && (
                                    <Key className="h-4 w-4 text-yellow-600" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {tool.provider} • {tool.description}
                                </p>

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(tool)}
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusColor(tool)}`}
                                  >
                                    {getStatusText(tool)}
                                  </Badge>
                                  {tool.lastTested && (
                                    <span className="text-xs text-muted-foreground">
                                      Last tested:{" "}
                                      {tool.lastTested.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTool(tool)}
                                data-testid={`tool-configure-${tool.id}`}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </Button>
                              <Switch
                                checked={tool.isEnabled}
                                onCheckedChange={(checked) =>
                                  handleToolToggle(tool.id, checked)
                                }
                                data-testid={`tool-toggle-${tool.id}`}
                              />
                            </div>
                          </div>
                        </CardHeader>

                        {/* Error Message */}
                        {tool.testStatus === "error" && tool.testMessage && (
                          <CardContent className="pt-0">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800 flex items-start gap-2">
                                <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {tool.testMessage}
                              </p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {/* Category Separator */}
                {categoryIndex < Object.entries(toolsByCategory).length - 1 && (
                  <div className="pt-4">
                    <Separator />
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {selectedTool && (
        <ToolConfigDialog
          tool={selectedTool}
          open={!!selectedTool}
          onOpenChange={(open: boolean) => !open && setSelectedTool(null)}
          onSave={handleToolUpdate}
        />
      )}
    </>
  );
}
