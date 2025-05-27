"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User, Copy, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ToolsAccordion, ToolCall } from "./tools-accordion";
import {
  CollectionsAccordion,
  KnowledgeSearchResult,
} from "./collections-accordion";

interface AgentChatPanelProps {
  agent: Agent;
}

export function AgentChatPanel({ agent }: AgentChatPanelProps) {
  const { toast } = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [knowledgeSearchResults, setKnowledgeSearchResults] = useState<
    KnowledgeSearchResult[]
  >([]);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          agentId: agent.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Check if the response is JSON or streaming
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        // Handle JSON response (when tools are used)
        const data = await response.json();

        // Handle tool calls if present
        if (data.toolCalls && data.toolCalls.length > 0) {
          const toolCallsForDisplay: ToolCall[] = data.toolCalls.map(
            (toolCall: any) => ({
              id: toolCall.toolCallId || `tool-${Date.now()}-${Math.random()}`,
              toolName: toolCall.toolName,
              parameters: toolCall.args || {},
              result: toolCall.result,
              status: "success",
              timestamp: new Date(),
              duration: 0,
            })
          );
          setToolCalls((prev) => [...prev, ...toolCallsForDisplay]);

          // Extract knowledge search results
          const knowledgeSearchCalls = data.toolCalls.filter(
            (toolCall: any) => toolCall.toolName === "search_knowledge"
          );

          if (knowledgeSearchCalls.length > 0) {
            const newKnowledgeResults: KnowledgeSearchResult[] =
              knowledgeSearchCalls.map((toolCall: any) => ({
                id: `knowledge-${Date.now()}-${Math.random()}`,
                query: toolCall.args?.query || "Unknown query",
                results: toolCall.result?.results || [],
                timestamp: new Date(),
              }));
            setKnowledgeSearchResults((prev) => [
              ...prev,
              ...newKnowledgeResults,
            ]);
          }
        }

        // Add assistant response
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.text || data.response || "No response",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle streaming response (when no tools are used)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        // Add assistant message placeholder for streaming
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        let fullResponse = "";
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);

            // Parse the data stream format
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("0:")) {
                // Extract the text content from the data stream
                try {
                  const jsonStr = line.substring(2); // Remove '0:' prefix
                  const data = JSON.parse(jsonStr);
                  if (data && typeof data === "string") {
                    fullResponse += data;
                  } else if (data && data.text) {
                    fullResponse += data.text;
                  }
                } catch (parseError) {
                  // If it's not JSON, treat it as plain text
                  const text = line.substring(2);
                  if (text.trim()) {
                    fullResponse += text;
                  }
                }
              }
            }

            // Update the assistant message in real-time for streaming
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          }
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          // Update message with error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: "Error: Failed to receive streaming response",
                  }
                : msg
            )
          );
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle copy message
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Info Header */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 w-48">
                <CardTitle className="text-base truncate">
                  {agent.name}
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {agent.description}
              </p>
            </div>
            {/* System Prompt in the middle */}
            {agent.systemPrompt && (
              <div className="text-xs text-muted-foreground p-2 rounded w-[75%]">
                <strong className="text-sm text-black">System Prompt:</strong>{" "}
                <div className="truncate">{agent.systemPrompt}</div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Tools and Collections */}
        <div className="space-y-6">
          {/* Tools Accordion */}
          <ToolsAccordion toolCalls={toolCalls} />

          {/* Collections Accordion */}
          <CollectionsAccordion
            agent={agent}
            searchResults={knowledgeSearchResults}
          />
        </div>

        {/* Right Column: Chat */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex flex-row gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {agent.name}
                </span>
                <div>
                  {isLoading && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 text-xs w-24 h-8 justify-center"
                    >
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      <span>Thinking...</span>
                    </Badge>
                  )}

                  {!isLoading && (
                    <Badge
                      variant={
                        agent.configuration.isEnabled ? "default" : "secondary"
                      }
                      className={
                        agent.configuration.isEnabled
                          ? "bg-green-100 text-green-800 text-xs w-24 h-8 justify-center"
                          : "text-xs w-24 h-6 justify-center"
                      }
                    >
                      {agent.configuration.isEnabled ? "Online" : "Offline"}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <div className="flex items-center gap-2 pb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                  </div>
                  <AlertDescription>
                    {error.message || "Something went wrong. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {!agent.configuration.isEnabled && (
                <Alert>
                  <div className="flex items-center gap-2 pb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Agent Disabled</AlertTitle>
                  </div>
                  <AlertDescription>
                    This agent is currently disabled. Enable it in the General
                    tab to start chatting.
                  </AlertDescription>
                </Alert>
              )}

              {/* Chat messages area */}
              <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto bg-muted/20">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Chat with {agent.name} to test its capabilities. The agent
                      will respond using its configured system prompt
                      {agent.collections &&
                        agent.collections.length > 0 &&
                        ` and has access to ${agent.collections.length} knowledge collection${agent.collections.length !== 1 ? "s" : ""}`}
                      .
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${
                            message.role === "user"
                              ? "flex-row-reverse"
                              : "flex-row"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`relative group rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border"
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            {message.role === "assistant" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() =>
                                  handleCopyMessage(message.id, message.content)
                                }
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input form */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      agent.configuration.isEnabled
                        ? `Message ${agent.name}...`
                        : "Agent is disabled"
                    }
                    disabled={isLoading || !agent.configuration.isEnabled}
                    className="flex-1 h-[42px] max-h-[120px] px-3 pt-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          !isLoading &&
                          agent.configuration.isEnabled &&
                          input.trim()
                        ) {
                          handleSubmit(e as any);
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isLoading ||
                      !input.trim() ||
                      !agent.configuration.isEnabled
                    }
                    className="self-end"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
