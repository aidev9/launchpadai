import { NextRequest, NextResponse } from "next/server";
import { Message } from "ai";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import {
  searchDocumentChunks,
  DocumentChunkSearchResult,
} from "@/app/(protected)/mycollections/actions";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the agent system prompt
const systemPrompt = `You are a helpful AI assistant that helps users find information in their document collections.
Your primary goal is to provide accurate information based on the search results from user's documents.

Guidelines:
1. Focus on answering questions using ONLY the provided search results
2. If the search results don't contain information to answer the question, acknowledge this limitation
3. Don't make up information that isn't in the search results
4. When citing information, reference the document it came from
5. Keep your responses clear, concise, and helpful
6. Maintain a conversational, friendly tone`;

export async function POST(req: NextRequest) {
  try {
    // Extract the message content and collection ID from the request
    const { messages, collectionId } = await req.json();

    // Ensure the API key is available
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is missing. Set it in your .env.local file.",
        }),
        { status: 500 }
      );
    }

    // Get current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User not authenticated",
        }),
        { status: 401 }
      );
    }

    // Check and consume prompt credit
    const creditResult = await consumePromptCredit({ userId });

    // Type assertion for the credit result
    const typedResult = creditResult as unknown as {
      data: {
        success: boolean;
        error?: string;
        needMoreCredits?: boolean;
        remainingCredits?: number;
      };
    };

    if (!typedResult.data?.success) {
      // User doesn't have enough credits
      return new Response(
        JSON.stringify({
          error: typedResult.data?.error || "Insufficient prompt credits",
          needMoreCredits: typedResult.data?.needMoreCredits || false,
        }),
        { status: 402 } // 402 Payment Required
      );
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // 1. Search for relevant documents based on the user's question
    const searchResults = await searchDocumentChunks(
      lastMessage.content,
      collectionId,
      1, // Page
      5 // Results per page - limit to top 5 for relevance
    );

    // Format search results for context
    let searchContext = "";
    let searchResultsArray: DocumentChunkSearchResult[] = [];

    if (
      searchResults.success &&
      searchResults.results &&
      searchResults.results.length > 0
    ) {
      searchResultsArray = searchResults.results;

      searchContext =
        "Here are relevant passages from the user's documents:\n\n";
      searchResults.results.forEach((result, index) => {
        searchContext += `Document: "${result.document_title}"\n`;
        searchContext += `Content: ${result.chunk_content}\n\n`;
      });
    } else {
      searchContext =
        "No relevant documents found in the collection for this query.";
    }

    // 2. Combine the search results with the user's message for context
    const allMessages: Message[] = [
      { id: "system", role: "system", content: systemPrompt },
      ...messages.slice(0, -1), // Previous conversation history
      {
        id: "context",
        role: "system",
        content: `The user asked: "${lastMessage.content}"\n\n${searchContext}\n\nRespond to the user's question based on this information.`,
      },
      lastMessage, // The actual user question
    ];

    // 3. Stream the AI response
    const result = streamText({
      model: openai("gpt-4o-mini"), // Use appropriate model
      messages: allMessages,
      temperature: 0.7,
    });

    // 4. Return the streaming response
    // The search results can't be properly included in the stream, so we'll modify the chat component
    // to handle this differently
    const responseStream = result.toDataStream();
    const finalResponse = new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain",
      },
    });

    return finalResponse;
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Error processing your request" }),
      { status: 500 }
    );
  }
}
