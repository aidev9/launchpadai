"use client";

import { useState, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Check,
  Key,
  Globe,
  Calculator,
  Cloud,
  Map,
  Calendar,
  Languages,
  Newspaper,
  Brain,
  Wrench,
  Settings,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  firebaseTools,
  ToolConfiguration,
} from "@/lib/firebase/client/FirebaseTools";
import { useRouter } from "next/navigation";

// Tool interface
interface Tool {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiKeyRequired: boolean;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Enhanced tool interface with configuration status
interface EnhancedTool extends Tool {
  isConfigured: boolean;
  isEnabled: boolean;
  testStatus?: "success" | "error" | "pending" | "never";
  testMessage?: string;
  hasApiKey?: boolean;
}

// Standard tools available for agents with icons
const standardTools: Tool[] = [
  {
    id: "search",
    name: "DuckDuckGo Search",
    description: "Search the web using DuckDuckGo",
    provider: "DuckDuckGo",
    apiKeyRequired: false,
    category: "Search",
    icon: Globe,
  },
  {
    id: "tavily",
    name: "Tavily Search",
    description: "Advanced web search with Tavily API",
    provider: "Tavily",
    apiKeyRequired: true,
    category: "Search",
    icon: Search,
  },
  {
    id: "weather",
    name: "Weather API",
    description: "Get current weather and forecasts",
    provider: "OpenWeatherMap",
    apiKeyRequired: true,
    category: "Weather",
    icon: Cloud,
  },
  {
    id: "news",
    name: "News API",
    description: "Access news articles from various sources",
    provider: "NewsAPI",
    apiKeyRequired: true,
    category: "News",
    icon: Newspaper,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    provider: "Internal",
    apiKeyRequired: false,
    category: "Utility",
    icon: Calculator,
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Search and retrieve information from Wikipedia",
    provider: "Wikipedia",
    apiKeyRequired: false,
    category: "Knowledge",
    icon: Brain,
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    description: "Computational knowledge engine",
    provider: "Wolfram Alpha",
    apiKeyRequired: true,
    category: "Knowledge",
    icon: Brain,
  },
  {
    id: "maps",
    name: "Maps & Directions",
    description: "Get maps, directions, and location information",
    provider: "Google Maps",
    apiKeyRequired: true,
    category: "Navigation",
    icon: Map,
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Access and manage calendar events",
    provider: "Google Calendar",
    apiKeyRequired: true,
    category: "Productivity",
    icon: Calendar,
  },
  {
    id: "translator",
    name: "Translator",
    description: "Translate text between languages",
    provider: "Google Translate",
    apiKeyRequired: true,
    category: "Language",
    icon: Languages,
  },
];

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

export function ToolsStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    wizardState?.tools || []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch tool configurations from Firebase
  const [toolConfigsSnapshot, loading, error] = useCollection(
    firebaseTools.getToolConfigurations()
  );

  // Merge static tool configs with Firebase configurations
  const enhancedTools = useMemo(() => {
    const firebaseConfigs: Record<string, ToolConfiguration> = {};

    if (toolConfigsSnapshot) {
      toolConfigsSnapshot.docs.forEach((doc) => {
        const config = doc.data() as ToolConfiguration;
        firebaseConfigs[config.toolId] = config;
      });
    }

    return standardTools.map((staticTool): EnhancedTool => {
      const firebaseConfig = firebaseConfigs[staticTool.id];

      if (firebaseConfig) {
        return {
          ...staticTool,
          isConfigured: staticTool.apiKeyRequired
            ? !!(firebaseConfig.apiKey && firebaseConfig.isEnabled)
            : true, // Tools without API key requirements are always configured
          isEnabled: firebaseConfig.isEnabled,
          testStatus: firebaseConfig.testStatus || "never",
          testMessage: firebaseConfig.testMessage,
          hasApiKey: !!firebaseConfig.apiKey,
        };
      }

      // Default state for tools without Firebase config
      return {
        ...staticTool,
        isConfigured: !staticTool.apiKeyRequired, // Tools without API key requirements are ready by default
        isEnabled: !staticTool.apiKeyRequired, // Enable tools that don't need configuration
        testStatus: "never",
        hasApiKey: false,
      };
    });
  }, [toolConfigsSnapshot]);

  // Get unique categories
  const categories = Array.from(
    new Set(enhancedTools.map((tool) => tool.category))
  );

  // Group tools by category
  const toolsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = enhancedTools.filter(
        (tool) => tool.category === category
      );
      return acc;
    },
    {} as Record<string, EnhancedTool[]>
  );

  // Filter tools based on search query
  const filteredToolsByCategory = Object.entries(toolsByCategory).reduce(
    (acc, [category, tools]) => {
      const filteredTools = tools.filter((tool) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.provider.toLowerCase().includes(query) ||
          tool.category.toLowerCase().includes(query)
        );
      });
      if (filteredTools.length > 0) {
        acc[category] = filteredTools;
      }
      return acc;
    },
    {} as Record<string, EnhancedTool[]>
  );

  // Update the wizard state when selected tools change
  useEffect(() => {
    if (wizardState) {
      if (JSON.stringify(wizardState.tools) !== JSON.stringify(selectedTools)) {
        setWizardState({
          ...wizardState,
          tools: selectedTools,
        });
      }
    }
  }, [selectedTools, setWizardState]);

  // Add tool to agent
  const addToolToAgent = (toolId: string) => {
    if (!selectedTools.includes(toolId)) {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  // Remove tool from agent
  const removeToolFromAgent = (toolId: string) => {
    setSelectedTools(selectedTools.filter((id) => id !== toolId));
  };

  // Navigate to tool configuration
  const configureToolHandler = (toolId: string) => {
    // Open tool configuration in a new tab to preserve wizard state
    window.open(`/settings/tools`, "_blank");
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedTools([]);
  };

  // Get selected tool objects for display
  const selectedToolObjects = enhancedTools.filter((tool) =>
    selectedTools.includes(tool.id)
  );

  // Get status badge for tool
  const getStatusBadge = (tool: EnhancedTool) => {
    if (!tool.apiKeyRequired) {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300"
        >
          <Check className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    }

    if (!tool.isConfigured) {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-300"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Needs Config
        </Badge>
      );
    }

    if (tool.testStatus === "success") {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300"
        >
          <Check className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    }

    if (tool.testStatus === "error") {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Test Failed
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-blue-100 text-blue-800 border-blue-300"
      >
        <Key className="h-3 w-3 mr-1" />
        Configured
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="tools-step">
      <div className="space-y-2">
        <Label>Agent Tools</Label>
        <p className="text-sm text-muted-foreground">
          Select tools for your agent to use. Tools are organized by category to
          make selection easier.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          data-testid="tools-search"
        />
      </div>

      {/* Selected Tools Summary */}
      {selectedTools.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Selected Tools ({selectedTools.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSelections}
                data-testid="clear-all-tools"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedToolObjects.map((tool) => (
                <Badge
                  key={tool.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <tool.icon className="h-3 w-3" />
                  {tool.name}
                  {tool.apiKeyRequired && (
                    <Key className="h-3 w-3 text-yellow-600" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools by Category */}
      <div className="space-y-6">
        {Object.entries(filteredToolsByCategory).map(([category, tools]) => {
          const CategoryIcon = categoryIcons[category] || Wrench;
          const selectedInCategory = tools.filter((tool) =>
            selectedTools.includes(tool.id)
          ).length;

          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{category}</CardTitle>
                    {selectedInCategory > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedInCategory} selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    const ToolIcon = tool.icon;
                    const isReadyToUse =
                      tool.isConfigured &&
                      (tool.testStatus === "success" || !tool.apiKeyRequired);

                    return (
                      <Card
                        key={tool.id}
                        className={`transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`tool-${tool.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <ToolIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium text-sm leading-tight">
                                  {tool.name}
                                </h4>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                )}
                              </div>

                              {/* Status Badge */}
                              <div className="mb-2">{getStatusBadge(tool)}</div>

                              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                {tool.description}
                              </p>

                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-muted-foreground">
                                  {tool.provider}
                                </span>
                                {tool.apiKeyRequired && (
                                  <div className="flex items-center gap-1">
                                    <Key className="h-3 w-3 text-yellow-600" />
                                    <span className="text-xs text-yellow-600">
                                      API Key
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {isReadyToUse ? (
                                  <Button
                                    size="sm"
                                    variant={
                                      isSelected ? "secondary" : "default"
                                    }
                                    onClick={() =>
                                      isSelected
                                        ? removeToolFromAgent(tool.id)
                                        : addToolToAgent(tool.id)
                                    }
                                    className="flex-1"
                                    data-testid={`${isSelected ? "remove" : "add"}-tool-${tool.id}`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check className="h-3 w-3 mr-1" />
                                        Added
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add to Agent
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      configureToolHandler(tool.id)
                                    }
                                    className="flex-1"
                                    data-testid={`configure-tool-${tool.id}`}
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    Configure Tool
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No results message */}
      {Object.keys(filteredToolsByCategory).length === 0 && searchQuery && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No tools found matching "{searchQuery}"
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Notice */}
      <div className="p-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-md">
        <div className="flex items-start gap-2">
          <Key className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Tool Configuration</p>
            <p className="mt-1">
              Tools marked with "Configure Tool" need API keys or additional
              setup. Click the button to configure them in Settings. Tools
              marked as "Ready" can be added to your agent immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
