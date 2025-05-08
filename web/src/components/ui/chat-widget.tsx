"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { IconArrowRight } from "@tabler/icons-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      initialMessages: [
        {
          id: "welcome-message",
          role: "assistant",
          content:
            "Hi! I'm your LaunchpadAI Assistant. How can I help acclerate your startup or product launch?",
        },
      ],
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat widget button (visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/80 z-50 flex items-center justify-center"
          aria-label="Open chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat modal (visible when chat is open) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden border border-gray-200">
          {/* Chat header */}
          <div className="bg-primary text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">LaunchpadAI Assistant</h3>
            <button
              onClick={toggleChat}
              className="p-1 rounded-full hover:bg-primary/80 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary/20 ml-4"
                      : "bg-gray-100 mr-4"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {message.role === "user" ? "You" : "LaunchpadAI Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input form */}
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 p-2 focus:outline-none text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`bg-primary text-white p-2 ${
                  isLoading || !input.trim()
                    ? "opacity-50"
                    : "hover:bg-primary/80"
                }`}
              >
                <IconArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
