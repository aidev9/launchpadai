import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Mark this file as a server component
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Skip authentication for now since we're in a server component
    // In a production environment, you would implement proper authentication
    // using cookies, JWT tokens, or other server-side auth methods

    // Parse request body
    const body = await req.json();
    const { query, results } = body;

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Format the search results for the prompt
    const formattedResults = results
      .map((result, index) => {
        return `Document ${index + 1}: "${result.document_title}"
Content: ${result.content}
Similarity: ${result.similarity}
---`;
      })
      .join("\n");

    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on search results from a document collection. 
Analyze the search results provided and give a comprehensive answer to the user's query.
If the search results don't contain relevant information, acknowledge that you don't have enough information to answer.
Always cite the document titles where you found the information.`,
        },
        {
          role: "user",
          content: `Query: ${query}

Search Results:
${formattedResults}

Please provide a comprehensive answer based on these search results.`,
        },
      ],
    });

    // Return the generated response
    return NextResponse.json({
      response: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
