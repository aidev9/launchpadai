import OpenAI from "openai";

export class OpenAIEmbedding {
  private model = "text-embedding-3-small";
  private apiKey = process.env.OPENAI_API_KEY || "";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  // Create embeddings with OpenAI client
  async createEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        input: text,
        model: this.model,
      });

      if (response.data && response.data.length > 0) {
        return response.data[0].embedding;
      } else {
        throw new Error("Invalid response from OpenAI embedding API");
      }
    } catch (error) {
      console.error("Error creating embeddings with OpenAI API:", error);
      throw error;
    }
  }

  // Extract keywords from text using OpenAI
  async extractKeywords(text: string): Promise<string[]> {
    try {
      const prompt = `
Text: ${text.substring(0, 8000)} // Truncate to stay within OpenAI limits

Extract the most important keywords from the above text. 
Return only the keywords as a comma-separated list, with no additional text.
Only include specific, relevant terms - not generic words. 
Limit to 10 keywords maximum.
`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      if (
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        const keywordsText = response.choices[0].message.content.trim();
        return keywordsText.split(",").map((k: string) => k.trim());
      } else {
        console.warn("Invalid response from OpenAI keyword extraction");
        return [];
      }
    } catch (error) {
      console.error("Error extracting keywords with OpenAI API:", error);
      return []; // Return empty array instead of throwing to continue processing
    }
  }
}
