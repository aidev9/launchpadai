"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User } from "lucide-react";

interface PublicAgent {
  id: string;
  name: string;
  description: string;
  configuration: {
    isEnabled: boolean;
  };
}

interface EmbeddedAgentChatUIProps {
  agent: PublicAgent;
  theme: "light" | "dark";
  hideIcon?: boolean;
}

export function EmbeddedAgentChatUI({
  agent,
  theme,
  hideIcon = false,
}: EmbeddedAgentChatUIProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `/api/agents/public/${agent.id}/chat`,
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! How can I assist you today?",
        },
      ],
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add(theme);
      return () => {
        document.documentElement.classList.remove(theme);
      };
    }
  }, [theme]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className={`flex flex-col h-full w-full ${theme === "dark" ? "dark bg-slate-900" : "bg-white"}`}
    >
      {/* Header */}
      <div className="border-b p-3 flex items-center gap-2">
        {!hideIcon && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <h1 className="font-medium text-sm">{agent.name}</h1>
          <p className="text-xs text-muted-foreground">{agent.description}</p>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className={`flex items-start ${hideIcon ? "" : "gap-2"}`}>
                  {message.role !== "user" && !hideIcon && (
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={hideIcon ? "w-full" : ""}>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && !hideIcon && (
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarFallback className="bg-muted-foreground text-background">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
