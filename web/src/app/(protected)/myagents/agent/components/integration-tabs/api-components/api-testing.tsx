"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, User, Bot } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";

interface ApiTestingProps {
  agent: Agent;
  currentConfig: {
    authType: "bearer" | "apikey" | "none";
    responseType: "streaming" | "single";
    apiKey: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ApiTesting({ agent, currentConfig }: ApiTestingProps) {
  const [testMessage, setTestMessage] = useState("Hello, how can you help me?");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const getEndpointUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://your-domain.com";
    return `${baseUrl}/api/agents/public/${agent.id}/chat`;
  };

  const testApiCall = async () => {
    if (!testMessage.trim()) return;

    setIsTestLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: testMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, assistantMessage]);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (currentConfig.authType === "bearer" && currentConfig.apiKey) {
        headers.Authorization = `Bearer ${currentConfig.apiKey}`;
      } else if (currentConfig.authType === "apikey" && currentConfig.apiKey) {
        headers["X-API-Key"] = currentConfig.apiKey;
      }

      // Add response type preference to headers
      if (currentConfig.responseType === "single") {
        headers["X-Response-Type"] = "single";
      }

      // Format the request body to match the chat endpoint expectations
      const requestBody = {
        messages: [
          {
            id: "test-message",
            role: "user",
            content: testMessage,
          },
        ],
      };

      const response = await fetch(getEndpointUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}\n${errorText}`
        );
      }

      if (currentConfig.responseType === "single") {
        // Handle single response (JSON)
        const data = await response.json();
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: data.response || JSON.stringify(data, null, 2),
                }
              : msg
          )
        );
      } else {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let fullResponse = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          // Update the assistant message in real-time for streaming
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        }
      }

      // Clear the input
      setTestMessage("");

      toast({
        title: "Success",
        description: "API test completed successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update assistant message with error
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${errorMessage}` }
            : msg
        )
      );

      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test API
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={chatMessages.length === 0}
          >
            Clear Chat
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages Area */}
        <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto bg-muted/20">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start a conversation to test your API</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
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
                      className={`rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content || (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            Thinking...
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter your test message..."
              rows={1}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  testApiCall();
                }
              }}
            />
            <Button
              onClick={testApiCall}
              disabled={isTestLoading || !testMessage.trim()}
              className="self-end"
              data-testid="test-api-call-button"
            >
              {isTestLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
