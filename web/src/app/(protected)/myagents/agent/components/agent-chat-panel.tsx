"use client";

import { useChat } from "ai/react";
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

interface AgentChatPanelProps {
  agent: Agent;
}

export function AgentChatPanel({ agent }: AgentChatPanelProps) {
  const { toast } = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/agents/chat",
      body: {
        agentId: agent.id,
      },
    });

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
    <div className="flex flex-col h-[70vh]">
      {/* Agent Info Header */}
      <Card className="mb-4">
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
            <div>
              {isLoading && (
                // <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 text-xs w-24 h-6 justify-center"
                >
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  <span>Thinking...</span>
                </Badge>
                // </div>
              )}

              {!isLoading && (
                <Badge
                  variant={
                    agent.configuration.isEnabled ? "default" : "secondary"
                  }
                  className={
                    agent.configuration.isEnabled
                      ? "bg-green-100 text-green-800 text-xs w-24 h-6 justify-center"
                      : "text-xs w-24 h-6 justify-center"
                  }
                >
                  {agent.configuration.isEnabled ? "Online" : "Offline"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
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
        <Alert className="mb-4">
          <div className="flex items-center gap-2 pb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Agent Disabled</AlertTitle>
          </div>
          <AlertDescription>
            This agent is currently disabled. Enable it in the General tab to
            start chatting.
          </AlertDescription>
        </Alert>
      )}

      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg mb-4 p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Chat with {agent.name} to test its capabilities. The agent will
              respond using its configured system prompt.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative group ${
                    message.role === "user" ? "max-w-[80%]" : "max-w-[90%]"
                  } p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {message.role === "user" ? "You" : agent.name}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto h-6 w-6 p-0"
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
                  <div className="whitespace-pre-wrap text-sm">
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
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder={
            agent.configuration.isEnabled
              ? `Message ${agent.name}...`
              : "Agent is disabled"
          }
          disabled={isLoading || !agent.configuration.isEnabled}
          className="w-full h-[42px] max-h-[120px] px-3 pt-2 pr-12 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading && agent.configuration.isEnabled && input.trim()) {
                handleSubmit(e as any);
              }
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={
            isLoading || !input.trim() || !agent.configuration.isEnabled
          }
          className="absolute right-0 top-1/2 transform -translate-y-[55%] h-11 w-11 pb-0 rounded-l-none"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Helpful tips */}
      <div className="mt-2 text-xs text-muted-foreground">
        <p>Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
