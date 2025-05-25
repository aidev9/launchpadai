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

// Standard tools available for agents
const standardTools = [
  {
    id: "search",
    name: "DuckDuckGo Search",
    description: "Search the web using DuckDuckGo",
    provider: "DuckDuckGo",
    apiKeyRequired: false,
    category: "Search",
  },
  {
    id: "tavily",
    name: "Tavily Search",
    description: "Advanced web search with Tavily API",
    provider: "Tavily",
    apiKeyRequired: true,
    category: "Search",
  },
  {
    id: "weather",
    name: "Weather API",
    description: "Get current weather and forecasts",
    provider: "OpenWeatherMap",
    apiKeyRequired: true,
    category: "Weather",
  },
  {
    id: "news",
    name: "News API",
    description: "Access news articles from various sources",
    provider: "NewsAPI",
    apiKeyRequired: true,
    category: "News",
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    provider: "Internal",
    apiKeyRequired: false,
    category: "Utility",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Search and retrieve information from Wikipedia",
    provider: "Wikipedia",
    apiKeyRequired: false,
    category: "Knowledge",
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    description: "Computational knowledge engine",
    provider: "Wolfram Alpha",
    apiKeyRequired: true,
    category: "Knowledge",
  },
  {
    id: "maps",
    name: "Maps & Directions",
    description: "Get maps, directions, and location information",
    provider: "Google Maps",
    apiKeyRequired: true,
    category: "Navigation",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Access and manage calendar events",
    provider: "Google Calendar",
    apiKeyRequired: true,
    category: "Productivity",
  },
  {
    id: "translator",
    name: "Translator",
    description: "Translate text between languages",
    provider: "Google Translate",
    apiKeyRequired: true,
    category: "Language",
  },
];

export function ToolsStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    wizardState?.tools || []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(
    new Set(standardTools.map((tool) => tool.category))
  );

  // Filter tools based on search query and category
  const filteredTools = standardTools.filter((tool) => {
    const matchesSearch = !searchQuery
      ? true
      : tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.provider.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter
      ? true
      : tool.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Update the wizard state when selected tools change
  useEffect(() => {
    if (wizardState) {
      // Only update if values have changed to prevent unnecessary renders
      if (JSON.stringify(wizardState.tools) !== JSON.stringify(selectedTools)) {
        setWizardState({
          ...wizardState,
          tools: selectedTools,
        });
      }
    }
  }, [selectedTools, setWizardState]);

  // Toggle tool selection
  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((id) => id !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Agent Tools</Label>
        <p className="text-sm text-muted-foreground">
          Select tools for your agent to use. Some tools require API keys that
          can be configured in the settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredTools.map((tool) => (
          <Card
            key={tool.id}
            className={`cursor-pointer transition-colors ${
              selectedTools.includes(tool.id) ? "border-primary" : ""
            }`}
            onClick={() => toggleTool(tool.id)}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <Checkbox
                checked={selectedTools.includes(tool.id)}
                onCheckedChange={() => toggleTool(tool.id)}
                className="mt-1"
              />
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{tool.name}</h3>
                  <Badge variant="outline">{tool.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    Provider: {tool.provider}
                  </span>
                  {tool.apiKeyRequired && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      API Key Required
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 border border-blue-200 bg-blue-50 text-blue-800 rounded-md">
        <p className="text-sm">
          <strong>Note:</strong> API keys for tools can be configured in the
          Settings section. Make sure to add the required API keys before using
          these tools with your agent.
        </p>
      </div>
    </div>
  );
}
