"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronUp,
  ChevronDown,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  status: "pending" | "success" | "error";
  timestamp: Date;
  duration?: number;
  error?: string;
}

interface ToolsAccordionProps {
  toolCalls: ToolCall[];
}

export function ToolsAccordion({ toolCalls }: ToolsAccordionProps) {
  const { toast } = useToast();
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  // Extract all sources from tool calls
  const extractSources = () => {
    const sources: Array<{ name: string; url?: string; type: string }> = [];

    toolCalls.forEach((call) => {
      if (call.status === "success" && call.result) {
        const result = call.result;

        // Handle search results
        if (result.results && Array.isArray(result.results)) {
          result.results.forEach((item: any) => {
            if (item.url && item.title) {
              sources.push({
                name: item.title,
                url: item.url,
                type:
                  item.source || call.toolName === "tavily"
                    ? "Tavily Search"
                    : "Search Result",
              });
            }
          });
        }

        // Handle news articles
        if (result.articles && Array.isArray(result.articles)) {
          result.articles.forEach((article: any) => {
            if (article.url && article.title) {
              sources.push({
                name: article.title,
                url: article.url,
                type: article.source || "News",
              });
            }
          });
        }

        // Handle Wikipedia results
        if (result.url && result.title && call.toolName === "wikipedia") {
          sources.push({
            name: result.title,
            url: result.url,
            type: "Wikipedia",
          });
        }

        // Handle weather data
        if (result.weather && call.toolName === "weather") {
          sources.push({
            name: "Weather Data",
            type: "OpenWeatherMap",
          });
        }

        // Handle calculator
        if (result.expression && call.toolName === "calculator") {
          sources.push({
            name: "Mathematical Calculation",
            type: "Internal Calculator",
          });
        }

        // Handle other tools
        if (
          !result.results &&
          !result.articles &&
          !result.weather &&
          !result.expression
        ) {
          sources.push({
            name: `${call.toolName} result`,
            type: call.toolName,
          });
        }
      }
    });

    // Remove duplicates based on URL or name
    const uniqueSources = sources.filter(
      (source, index, self) =>
        index ===
        self.findIndex(
          (s) =>
            (source.url && s.url === source.url) ||
            (!source.url && s.name === source.name && s.type === source.type)
        )
    );

    return uniqueSources;
  };

  const toggleExpanded = (callId: string) => {
    const newExpanded = new Set(expandedCalls);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedCalls(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ToolCall["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  const renderResult = (result: any) => {
    if (!result) return null;

    // Handle different result types
    if (typeof result === "string") {
      return (
        <div className="space-y-2">
          <p className="text-sm">{result}</p>
        </div>
      );
    }

    if (typeof result === "object") {
      // Handle search results
      if (result.results && Array.isArray(result.results)) {
        return (
          <div className="space-y-2">
            {result.message && (
              <p className="text-sm font-medium text-green-700">
                {result.message}
              </p>
            )}
            {result.answer && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200 mb-2">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  AI Answer Summary:
                </h4>
                <p className="text-sm text-blue-800">{result.answer}</p>
              </div>
            )}
            {result.results.slice(0, 3).map((item: any, index: number) => (
              <div key={index} className="p-2 bg-gray-50 rounded border">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium flex-1">{item.title}</h4>
                  {item.source && (
                    <Badge variant="outline" className="text-xs">
                      {item.source}
                    </Badge>
                  )}
                </div>
                {(item.snippet || item.content) && (
                  <p className="text-xs text-gray-600 mt-1">
                    {item.snippet || item.content}
                  </p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View source
                  </a>
                )}
              </div>
            ))}
            {result.results.length > 3 && (
              <p className="text-xs text-gray-500">
                +{result.results.length - 3} more results
              </p>
            )}
          </div>
        );
      }

      // Handle weather results
      if (result.weather) {
        return (
          <div className="space-y-2">
            {result.message && (
              <p className="text-sm font-medium text-green-700">
                {result.message}
              </p>
            )}
            <div className="p-2 bg-blue-50 rounded border">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium flex-1">
                  {result.weather.location}
                </h4>
                <Badge variant="outline" className="text-xs">
                  OpenWeatherMap
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <div>Temperature: {result.weather.temperature}</div>
                <div>Feels like: {result.weather.feelsLike}</div>
                <div>Humidity: {result.weather.humidity}</div>
                <div>Wind: {result.weather.windSpeed}</div>
              </div>
              <p className="text-xs text-gray-600 mt-1 capitalize">
                {result.weather.description}
              </p>
            </div>
          </div>
        );
      }

      // Handle calculation results
      if (result.result !== undefined && result.expression) {
        return (
          <div className="space-y-2">
            {result.message && (
              <p className="text-sm font-medium text-green-700">
                {result.message}
              </p>
            )}
            <div className="p-2 bg-purple-50 rounded border">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium">
                  Mathematical Calculation
                </span>
                <Badge variant="outline" className="text-xs">
                  Internal Calculator
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-mono">{result.expression}</span>
                <span className="mx-2">=</span>
                <span className="font-mono font-bold">{result.result}</span>
              </div>
            </div>
          </div>
        );
      }

      // Handle Wikipedia results
      if (
        result.title &&
        result.summary &&
        result.url &&
        !result.articles &&
        !result.results
      ) {
        return (
          <div className="space-y-2">
            {result.message && (
              <p className="text-sm font-medium text-green-700">
                {result.message}
              </p>
            )}
            <div className="p-2 bg-green-50 rounded border">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium flex-1">{result.title}</h4>
                <Badge variant="outline" className="text-xs">
                  Wikipedia
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">{result.summary}</p>
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Read on Wikipedia
                </a>
              )}
            </div>
          </div>
        );
      }

      // Handle news results
      if (result.articles && Array.isArray(result.articles)) {
        return (
          <div className="space-y-2">
            {result.message && (
              <p className="text-sm font-medium text-green-700">
                {result.message}
              </p>
            )}
            {result.articles.slice(0, 2).map((article: any, index: number) => (
              <div key={index} className="p-2 bg-orange-50 rounded border">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium flex-1">
                    {article.title}
                  </h4>
                  {article.source && (
                    <Badge variant="outline" className="text-xs">
                      {article.source}
                    </Badge>
                  )}
                </div>
                {article.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {article.publishedAt && (
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {article.author && <span>• by {article.author}</span>}
                  </div>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Read article
                    </a>
                  )}
                </div>
              </div>
            ))}
            {result.articles.length > 2 && (
              <p className="text-xs text-gray-500">
                +{result.articles.length - 2} more articles
              </p>
            )}
          </div>
        );
      }

      // Generic object display
      return (
        <div className="space-y-2">
          {result.message && (
            <p className="text-sm font-medium text-green-700">
              {result.message}
            </p>
          )}
          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
        {String(result)}
      </pre>
    );
  };

  if (toolCalls.length === 0) return null;

  const sources = extractSources();

  return (
    <Card className="mb-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tool-calls" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Tool Calls</span>
              <Badge variant="secondary" className="text-xs">
                {toolCalls.length}
              </Badge>
              {sources.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {sources.length} source{sources.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {/* Sources Summary */}
            {sources.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Sources Used
                </h4>
                <div className="space-y-1">
                  {sources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Badge variant="secondary" className="text-xs">
                        {source.type}
                      </Badge>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline flex items-center gap-1"
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-700">{source.name}</span>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const sourcesList = sources
                      .map((source) =>
                        source.url
                          ? `- [${source.name}](${source.url}) - ${source.type}`
                          : `- ${source.name} - ${source.type}`
                      )
                      .join("\n");
                    copyToClipboard(
                      `**Sources:**\n${sourcesList}`,
                      "Sources list"
                    );
                  }}
                  className="mt-2 h-6 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Sources
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {toolCalls.map((call) => (
                <Card key={call.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(call.status)}
                        <CardTitle className="text-sm">
                          {call.toolName}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(call.status)}`}
                        >
                          {call.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatTimestamp(call.timestamp)}</span>
                        {call.duration && (
                          <span>({formatDuration(call.duration)})</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(call.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedCalls.has(call.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Parameters */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">
                          Parameters:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(call.parameters, null, 2),
                              "Parameters"
                            )
                          }
                          className="h-5 w-5 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      {expandedCalls.has(call.id) ? (
                        <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                          {JSON.stringify(call.parameters, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-xs text-gray-600">
                          {Object.entries(call.parameters)
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span>{" "}
                                {String(value).length > 50
                                  ? String(value).substring(0, 50) + "..."
                                  : String(value)}
                              </div>
                            ))}
                          {Object.keys(call.parameters).length > 2 && (
                            <div className="text-gray-400">
                              +{Object.keys(call.parameters).length - 2} more
                              parameters
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Result or Error */}
                    {call.status === "success" && call.result && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              Result:
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  typeof call.result === "string"
                                    ? call.result
                                    : JSON.stringify(call.result, null, 2),
                                  "Result"
                                )
                              }
                              className="h-5 w-5 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {renderResult(call.result)}
                        </div>
                      </>
                    )}

                    {call.status === "error" && call.error && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-red-600">
                            Error:
                          </span>
                          <div className="text-xs text-red-700 bg-red-50 p-2 rounded border">
                            {call.error}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
