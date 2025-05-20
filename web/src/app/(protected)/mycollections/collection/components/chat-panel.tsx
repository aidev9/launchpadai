"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Document, Collection } from "@/lib/firebase/schema";
import { DocumentChunkSearchResult } from "../../actions";

interface ChatPanelProps {
  collection: Collection;
  documents: Document[];
}

export function ChatPanel({ collection }: ChatPanelProps) {
  const [searchResults, setSearchResults] = useState<
    DocumentChunkSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      collectionId: collection.id,
    },
  });

  // Custom submit handler to fetch search results before submitting to chat
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Don't process empty messages
    if (!input.trim()) return;

    // Save the query for reference
    setLastQuery(input);

    try {
      // Start searching
      setIsSearching(true);
      setSearchError(null);

      // Fetch search results for the query
      const response = await fetch("/api/collection-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input,
          collectionId: collection.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch search results");
      }

      // Store search results
      setSearchResults(data.results || []);

      // Submit the chat message
      handleChatSubmit(e);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "An error occurred while searching documents"
      );

      // Still submit the message to chat API even if search fails
      handleChatSubmit(e);
    } finally {
      setIsSearching(false);
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

  return (
    <div className="flex flex-col h-[70vh]">
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

      {searchError && (
        <Alert variant="destructive" className="mb-4">
          <div className="flex items-center gap-2 pb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Search Error</AlertTitle>
          </div>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg mb-4 p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-500 italic p-4">
            Ask questions about your collection "{collection.title}". The AI
            will search your documents and provide answers based on their
            content.
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Determine if we should show sources for this message
              const showSources =
                message.role === "assistant" &&
                index > 0 &&
                messages[index - 1].role === "user" &&
                searchResults.length > 0 &&
                // Only show sources for the most recent AI message
                index === messages.length - 1;

              return (
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

                  {/* Display search results for the most recent assistant message */}
                  {showSources && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Sources:</div>
                      <div className="text-sm">
                        {searchResults.map((result, i) => (
                          <div
                            key={i}
                            className="mb-2 p-2 bg-gray-100 rounded text-xs"
                          >
                            <div className="font-medium">
                              {result.document_title}
                            </div>
                            <div className="text-gray-600 truncate">
                              {result.chunk_content.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 py-2 bg-background"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your collection..."
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading || isSearching}
            data-testid="chat-input"
          />
          <Button
            type="submit"
            variant="default"
            size="default"
            className="rounded-l-none h-[42px]"
            disabled={isLoading || isSearching || !input.trim()}
            data-testid="chat-submit-button"
          >
            {isLoading || isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
