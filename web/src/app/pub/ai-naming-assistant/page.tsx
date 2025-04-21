"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import Link from "next/link";
// import Header from "@/components/waitlist/Header";
import Footer from "@/components/waitlist/Footer";

export default function AInamingAssistant() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai-naming-assistant",
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
    <div className="flex flex-col min-h-screen">
      {/* Custom Header with Back Button */}
      <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="ml-2 text-xl font-bold text-gray-800">
              LaunchpadAI
            </span>
          </Link>

          <h1 className="text-xl font-semibold text-center absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            AI Startup Naming Assistant
          </h1>

          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow pt-16 pb-16">
        <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-160px)]">
          <div className="mb-4 mt-6">
            <h1 className="text-2xl font-bold mb-2 md:hidden">
              AI Startup Naming Assistant
            </h1>
            <p className="text-gray-600">
              Chat with our AI assistant to find the perfect name for your
              startup or product.
            </p>
          </div>

          <div className="flex-grow overflow-y-auto border border-gray-300 rounded-lg mb-4 p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-gray-500 italic">
                Start the conversation to get naming suggestions for your
                startup or product. The assistant will ask you a few questions
                to understand your business before generating name ideas.
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

          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about startup naming..."
              className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white p-3 rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>

          {error && (
            <div className="text-red-500 mt-2">
              Error:{" "}
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
