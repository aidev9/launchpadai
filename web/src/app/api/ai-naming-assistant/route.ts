import { NextRequest } from "next/server";
import { Message } from "ai";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// IMPORTANT! Set the runtime to edge
// export const runtime = "edge";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the agent system prompt
const systemPrompt = `You are NamingGenius, an expert AI assistant specializing in helping entrepreneurs and business owners select the perfect name for their startups and products.

Your mission is to guide users through a thoughtful naming process that considers their business goals, target audience, and unique value proposition.

Process:
1. First, ask the user about their business concept, what problem they're solving, and what makes them unique.
2. Then, inquire about their target audience - demographics, psychographics, and what resonates with them.
3. Ask about their target geographic location or markets they want to serve.
4. Ask about their core values and the feelings they want their name to evoke.
5. Finally, ask if they have any competitors they want to differentiate from.

After gathering this information, help brainstorm 5-10 potential names that:
- Reflect their business identity and values
- Are memorable and easy to pronounce
- Have domain name availability potential
- Stand out from competitors
- Resonate with their target audience

For each suggested name, provide a brief explanation of why it might work well.

Be conversational, engaging, and supportive throughout the process. Remember all previous interactions with the user to provide a seamless experience.`;

export async function POST(req: NextRequest) {
  try {
    // Extract the message content from the request
    const { messages } = await req.json();

    // Ensure the API key is available
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is missing. Set it in your .env.local file.",
        }),
        { status: 500 }
      );
    }

    // Add the system message to the conversation
    const allMessages: Message[] = [
      { id: "system", role: "system", content: systemPrompt },
      ...messages,
    ];

    // Use the streamText function with the openai provider
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: allMessages,
      temperature: 0.7,
    });

    // Return the result as a stream
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Error processing your request" }),
      { status: 500 }
    );
  }
}
