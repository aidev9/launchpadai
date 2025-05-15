"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAtom } from "jotai";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import InsufficientCreditsAlert from "@/components/prompt-credits/insufficient-credits-alert";

export default function AInamingAssistant() {
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai-naming-assistant",
      onResponse: (response) => {
        // Immediate update when message is sent (decrease credits)
        if (promptCredits && response.status === 200) {
          // Optimistically update the credit count for immediate feedback
          setPromptCredits({
            ...promptCredits,
            remainingCredits: promptCredits.remainingCredits - 1,
            totalUsedCredits: (promptCredits.totalUsedCredits || 0) + 1,
          });
        }
      },
      onFinish: async () => {
        // After completion, update credit balance with actual data from server
        try {
          const result = await fetchPromptCredits();
          if (result.success && result.credits) {
            setPromptCredits(result.credits);
          }
        } catch (error) {
          console.error("Failed to update credit balance:", error);
        }
      },
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages container but not to input box
  useEffect(() => {
    if (messagesEndRef.current) {
      // Only scroll messages container, not the entire page
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <Main className="flex flex-col h-[calc(100vh-64px)] pb-0 px-4">
      <div className="flex flex-col h-full">
        {/* Breadcrumbs and header section */}
        <div className="space-y-6 mb-4">
          {/* Breadcrumbs navigation */}
          <div className="flex flex-col space-y-4">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/dashboard" },
                { label: "Tools", href: "/tools" },
                { label: "Naming Assistant", href: "", isCurrentPage: true },
              ]}
            />
          </div>

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Naming Assistant
            </h1>
          </div>

          {error &&
            // Check the error type and if it's insufficient credits, display a specific message
            (error.message
              ?.toLowerCase()
              .includes("insufficient prompt credits") ? (
              <InsufficientCreditsAlert className="mb-4" />
            ) : (
              <Alert variant="destructive" className="mb-4">
                <div className="flex items-center gap-2 pb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                </div>
                <AlertDescription>
                  {error.message || "Something went wrong. Please try again."}
                </AlertDescription>
              </Alert>
            ))}

          <p className="text-gray-600">
            Chat with our AI assistant to find the perfect name for your startup
            or product.
          </p>
        </div>

        {/* Expandable chat area */}
        <div className="flex-grow overflow-y-auto border border-gray-300 rounded-lg mb-4 p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-gray-500 italic p-4">
              Start the conversation to get naming suggestions for your startup
              or product. The assistant will ask you a few questions to
              understand your business before generating name ideas.
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 ml-8"
                      : "bg-white mr-8 border border-gray-200"
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              {isLoading && (
                <div className="flex items-center text-gray-500 italic">
                  <div className="animate-pulse mr-2">•••</div>
                  AI is thinking...
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky input form at the bottom */}
        <div className="sticky bottom-0 py-4 bg-background border-t">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about startup naming..."
              className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="default"
              size="default"
              className="rounded-l-none h-[46px]"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </Main>
  );
}
