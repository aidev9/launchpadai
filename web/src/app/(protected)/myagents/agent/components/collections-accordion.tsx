"use client";

import { useState, useEffect } from "react";
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
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  FileText,
  Database,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Agent, Collection } from "@/lib/firebase/schema";
import { getUserCollections } from "@/lib/firebase/collections";

export interface KnowledgeSearchResult {
  id: string;
  query: string;
  results: Array<{
    rank: number;
    title: string;
    content: string;
    relevance_score: number;
    source_collection: string;
    document_id: string;
    chunk_index: number;
    file_url?: string;
  }>;
  timestamp: Date;
}

interface CollectionsAccordionProps {
  agent: Agent;
  searchResults: KnowledgeSearchResult[];
}

export function CollectionsAccordion({
  agent,
  searchResults,
}: CollectionsAccordionProps) {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get unique collection IDs from search results
  const usedCollectionIds = Array.from(
    new Set(
      searchResults.flatMap((result) =>
        result.results.map((r) => r.source_collection)
      )
    )
  );

  // Fetch collection details
  useEffect(() => {
    const fetchCollections = async () => {
      if (!agent.collections || agent.collections.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getUserCollections();
        if (result.success) {
          // Filter to only include collections assigned to this agent
          const agentCollections = result.collections.filter((collection) =>
            agent.collections.includes(collection.id)
          );
          setCollections(agentCollections);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [agent.collections]);

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

  const getCollectionName = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.title || `Collection ${collectionId.slice(0, 8)}...`;
  };

  const formatRelevanceScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Don't render if agent has no collections
  if (!agent.collections || agent.collections.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="mb-4">
      <AccordionItem value="collections" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Collections & Knowledge Search</span>
            <Badge variant="secondary" className="ml-2">
              {usedCollectionIds.length > 0
                ? usedCollectionIds.length
                : agent.collections.length}{" "}
              collection
              {(usedCollectionIds.length > 0
                ? usedCollectionIds.length
                : agent.collections.length) !== 1
                ? "s"
                : ""}
            </Badge>
            {searchResults.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {searchResults.reduce(
                  (total, result) => total + result.results.length,
                  0
                )}{" "}
                search results
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Collections Section */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {usedCollectionIds.length > 0
                  ? "Collections Used"
                  : "Available Collections"}
              </h4>
              {isLoading ? (
                <div className="space-y-2">
                  {(usedCollectionIds.length > 0
                    ? usedCollectionIds
                    : agent.collections
                  ).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 bg-gray-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-2">
                  {(usedCollectionIds.length > 0
                    ? usedCollectionIds
                    : agent.collections
                  ).map((collectionId) => {
                    const collection = collections.find(
                      (c) => c.id === collectionId
                    );
                    return (
                      <Card key={collectionId} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <h5 className="text-sm font-medium truncate">
                                {collection?.title ||
                                  `Collection ${collectionId.slice(0, 8)}...`}
                              </h5>
                              <Badge variant="outline">
                                {collection?.status || "unknown"}
                              </Badge>
                              {usedCollectionIds.includes(collectionId) && (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  Used
                                </Badge>
                              )}
                            </div>
                            {collection?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {collection.description}
                              </p>
                            )}
                            {collection?.tags && collection.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {collection.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {collection.tags.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{collection.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(collectionId, "Collection ID")
                            }
                            className="ml-2 h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Results Section */}
            {searchResults.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Recent Knowledge Search Results
                  </h4>
                  <div className="space-y-3">
                    {searchResults.map((searchResult) => (
                      <Card key={searchResult.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                Query: "{searchResult.query}"
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {searchResult.results.length} results
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {searchResult.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <ScrollArea className="max-h-64">
                            <div className="space-y-2">
                              {searchResult.results.map((result, index) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-3 bg-gray-50"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Badge variant="secondary">
                                        #{result.rank}
                                      </Badge>
                                      <h6 className="text-sm font-medium truncate">
                                        {result.title}
                                      </h6>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground">
                                          {formatRelevanceScore(
                                            result.relevance_score
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {result.file_url && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            window.open(
                                              result.file_url,
                                              "_blank"
                                            )
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(
                                            result.content,
                                            "Content"
                                          )
                                        }
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <p className="text-xs text-gray-700 mb-2">
                                    {truncateContent(result.content)}
                                  </p>

                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      Collection:{" "}
                                      {getCollectionName(
                                        result.source_collection
                                      )}
                                    </span>
                                    <span>•</span>
                                    <span>Chunk: {result.chunk_index + 1}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
