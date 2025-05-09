"use server";

import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { type Product } from "@/lib/firebase/schema";
import { type QuestionAnswer } from "@/lib/firebase/question-answers";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Annotation, START, END } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

/**
 * Interface for asset generation data
 */
export interface AssetGenerationData {
  systemPrompt: string;
  document: string;
  product: Product;
  questionAnswers: QuestionAnswer[];
  notes?: { id: string; note_body: string; updatedAt: number }[];
  asset?: {
    title: string;
    description: string;
    phase: string;
    systemPrompt: string;
  };
}

/**
 * Constant for standard document generation instructions
 */
const STANDARD_DOCUMENT_PROMPT = `You are generating a detailed {document} for a startup. 
Use the provided product details, notes, and question/answer pairs to create a comprehensive document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.
If notes are provided, they take precedence over question/answer pairs.
Document should be well-structured and easy to read.
The document MUST be at least 2000 words.
Expand on all sections with more detailed information, examples, and analysis.
`;

/**
 * Format product details for display
 */
function formatProductDetails(product: Product): string {
  return `Product Name: ${product.name || "Unnamed Product"}
          Product Description: ${product.description || "Not provided"}
          Problem: ${product.problem || "Not provided"}
          Team: ${product.team || "Not provided"}
          Website: ${product.website || "Not provided"}
          Country: ${product.country || "Not provided"}
          Stage: ${product.stage || "Not provided"}
        `;
}

/**
 * Format asset information if available
 */
function formatAssetInfo(
  document: string,
  asset?: AssetGenerationData["asset"]
): string {
  if (!asset) return "";

  return `Asset Information:
Title: ${asset.title || document}
Description: ${asset.description || "Not provided"}
Phase: ${asset.phase || "Not provided"}
${asset.systemPrompt ? `Additional Instructions: ${asset.systemPrompt}` : ""}`;
}

/**
 * Generate a standard user message with product details
 */
function createStandardUserMessage(
  document: string,
  product: Product,
  noQANote = true
): { role: "user"; content: string } {
  let content = `
Generate a detailed ${document} for a product with these details:

${formatProductDetails(product)}`;

  if (noQANote) {
    content += `

Note: This is a preliminary version as no detailed Q&A information is available yet.`;
  }

  return {
    role: "user" as const,
    content: content.trim(),
  };
}

/**
 * Extract content from model response
 */
function extractContentFromResponse(response: any): string {
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response);
}

/**
 * Format question/answers for input
 */
function formatQuestionsAndAnswers(questionAnswers: QuestionAnswer[]): {
  formattedQAs: string;
  answeredQuestions: QuestionAnswer[];
} {
  // Filter out questions that don't have answers
  const answeredQuestions = questionAnswers.filter(
    (qa) => qa.answer && qa.answer.trim() !== ""
  );

  // Format the question/answers for the model input
  const formattedQAs =
    answeredQuestions.length > 0
      ? answeredQuestions
          .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
          .join("\n\n")
      : "";

  return { formattedQAs, answeredQuestions };
}

/**
 * State annotation for the LangGraph asset generation workflow
 */
const AssetGenerationStateAnnotation = Annotation.Root({
  systemPrompt: Annotation<string>(),
  document: Annotation<string>(),
  product: Annotation<Product>(),
  questionAnswers: Annotation<QuestionAnswer[]>(),
  notes: Annotation<{ id: string; note_body: string; updatedAt: number }[]>(),
  formattedQAs: Annotation<string>(),
  formattedNotes: Annotation<string>(),
  generatedContent: Annotation<string>(),
  hasAnsweredQuestions: Annotation<boolean>(),
  hasNotes: Annotation<boolean>(),
  asset: Annotation<
    | {
        title: string;
        description: string;
        phase: string;
        systemPrompt: string;
      }
    | undefined
  >(),
});

/**
 * Create a consolidated system prompt combining base system prompt with document-specific instructions
 */
function createUnifiedSystemPrompt(
  baseSystemPrompt: string,
  document: string,
  asset?: AssetGenerationData["asset"]
): string {
  return `${baseSystemPrompt}

${STANDARD_DOCUMENT_PROMPT.replace("{document}", document)}

${formatAssetInfo(document, asset)}`.trim();
}

/**
 * Utility function to count words in a string
 */
function countWords(text: string): number {
  // Remove markdown formatting, code blocks, and other non-text elements
  const cleanedText = text
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/#{1,6}\s.*$/gm, "") // Remove headings
    .replace(/\*\*|__|\*|_|\[.*?\]\(.*?\)/g, ""); // Remove bold, italic, links

  // Split by whitespace and filter out empty strings
  const words = cleanedText.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Model constants for consistent usage
 */
const MODEL_CONFIG = {
  standard: {
    modelName: "gpt-4o-mini",
    temperature: 0.7,
  },
  verbose: {
    modelName: "gpt-4o-mini",
    temperature: 1.0, // Higher temperature for more verbose output during retries
  },
};

/**
 * Validates and potentially regenerates content to meet minimum word count
 */
async function validateWordCount(
  content: string,
  minWords: number,
  regenerationFn: () => Promise<string>,
  maxAttempts: number = 2 // Reduced from 3 to 2 attempts
): Promise<string> {
  let validatedContent = content;
  let attempts = 0;

  while (countWords(validatedContent) < minWords && attempts < maxAttempts) {
    console.log(
      `Content has ${countWords(validatedContent)} words, which is less than the required ${minWords}. Regenerating... (Attempt ${attempts + 1}/${maxAttempts})`
    );
    attempts++;

    // Try regenerating content with more explicit instructions
    validatedContent = await regenerationFn();
  }

  return validatedContent;
}

/**
 * Generate asset content using LangChain
 */
export async function generateAssetContent({
  systemPrompt,
  document,
  product,
  questionAnswers,
}: AssetGenerationData): Promise<string> {
  try {
    const { formattedQAs, answeredQuestions } =
      formatQuestionsAndAnswers(questionAnswers);

    // Create the model using the standard config
    const model = new ChatOpenAI(MODEL_CONFIG.standard);

    // Use the consolidated system prompt
    const unifiedSystemPrompt = createUnifiedSystemPrompt(
      systemPrompt,
      document
    );

    // Create the prompt template with a single system message
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", unifiedSystemPrompt],
      [
        "user",
        `
${formatProductDetails(product)}

Here are all the question/answer pairs available for this product:
{question_answers}

Please generate a comprehensive ${document} based on this information. The document MUST be at least 2000 words.
      `,
      ],
    ]);

    // Create the chain
    const chain = RunnableSequence.from([
      {
        question_answers: async () => formattedQAs,
      },
      promptTemplate,
      model,
    ]);

    // Generate the content
    const response = await chain.invoke({});

    // Extract the content
    let generatedContent = extractContentFromResponse(response);

    // Validate word count and regenerate if necessary
    generatedContent = await validateWordCount(
      generatedContent,
      2000,
      async () => {
        // Use verbose model config for regeneration attempts
        const verboseModel = new ChatOpenAI(MODEL_CONFIG.verbose);

        const enhancedPrompt = ChatPromptTemplate.fromMessages([
          ["system", unifiedSystemPrompt],
          [
            "user",
            `
${formatProductDetails(product)}

Here are all the question/answer pairs available for this product:
${formattedQAs}

Please generate a comprehensive and DETAILED ${document} based on this information. 
The document MUST be at least 2000 words. Your previous attempt was too short.
Expand on all sections with more detailed information, examples, and analysis.
            `,
          ],
        ]);

        const enhancedChain = enhancedPrompt
          .pipe(verboseModel)
          .pipe(new StringOutputParser());
        return await enhancedChain.invoke({});
      }
    );

    return generatedContent;
  } catch (error) {
    console.error("Error in AI content generation:", error);
    throw error;
  }
}

/**
 * Generate asset content using LangGraph
 * This implementation uses StateGraph for more flexible and extensible workflow
 */
export async function generateAssetContentWithLangGraph({
  systemPrompt,
  document,
  product,
  questionAnswers,
  notes = [],
  asset,
}: AssetGenerationData): Promise<string> {
  console.log("[LangGraph]");
  try {
    // Use the utility function for formatting questions and answers
    const { formattedQAs, answeredQuestions } =
      formatQuestionsAndAnswers(questionAnswers);

    // Format the notes for the model input (if any)
    const formattedNotes =
      notes.length > 0
        ? notes.map((note) => `Note: ${note.note_body}`).join("\n\n")
        : "";

    // Initialize state
    const initialState = {
      systemPrompt,
      document,
      product,
      questionAnswers,
      notes,
      formattedQAs,
      formattedNotes,
      generatedContent: "",
      hasAnsweredQuestions: answeredQuestions.length > 0,
      hasNotes: notes.length > 0,
      asset,
    };

    // Define LangGraph nodes

    /**
     * Generates comprehensive content using notes, Q&A data and product information
     */
    const generateFullContent = async (
      state: typeof AssetGenerationStateAnnotation.State
    ) => {
      const model = new ChatOpenAI(MODEL_CONFIG.standard);

      // Use the unified system prompt
      const unifiedSystemPrompt = createUnifiedSystemPrompt(
        state.systemPrompt,
        state.document,
        state.asset
      );

      // Create the prompt template with a single system message
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", unifiedSystemPrompt],
        [
          "user",
          `
${formatProductDetails(state.product)}

${state.hasNotes ? "Here are the notes for this product (these take precedence):\n" + state.formattedNotes + "\n\n" : ""}
${state.hasAnsweredQuestions ? "Here are all the question/answer pairs available for this product:\n" + state.formattedQAs : ""}

Please generate a comprehensive ${state.document} based on this information. The document MUST be at least 2000 words.
          `,
        ],
      ]);

      // Create and invoke the chain
      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

      const content = await chain.invoke({});

      return {
        generatedContent: content,
      };
    };

    /**
     * Validates word count and regenerates if needed
     */
    const validateContent = async (
      state: typeof AssetGenerationStateAnnotation.State
    ) => {
      const wordCount = countWords(state.generatedContent);
      console.log(`Generated content has ${wordCount} words`);

      if (wordCount >= 2000) {
        return { generatedContent: state.generatedContent };
      }

      console.log("Content doesn't meet minimum word count. Regenerating...");

      const model = new ChatOpenAI(MODEL_CONFIG.verbose);

      // Create enhanced prompt with explicit instructions to generate longer content
      const unifiedSystemPrompt = createUnifiedSystemPrompt(
        state.systemPrompt,
        state.document,
        state.asset
      );

      const enhancedPrompt = ChatPromptTemplate.fromMessages([
        ["system", unifiedSystemPrompt],
        [
          "user",
          `
${formatProductDetails(state.product)}

${state.hasNotes ? "Here are the notes for this product (these take precedence):\n" + state.formattedNotes + "\n\n" : ""}
${state.hasAnsweredQuestions ? "Here are all the question/answer pairs available for this product:\n" + state.formattedQAs : ""}

Please generate a comprehensive and DETAILED ${state.document} based on this information.
The document MUST be at least 2000 words. Your previous attempt was only ${wordCount} words, which is too short.
Expand on all sections with more detailed information, examples, and analysis.
          `,
        ],
      ]);

      const chain = enhancedPrompt.pipe(model).pipe(new StringOutputParser());
      const enhancedContent = await chain.invoke({});

      return { generatedContent: enhancedContent };
    };

    // Create the StateGraph
    const graph = new StateGraph(AssetGenerationStateAnnotation)
      .addNode("fullContentGeneration", generateFullContent)
      .addNode("contentValidation", validateContent)
      .addEdge(START, "fullContentGeneration")
      .addEdge("fullContentGeneration", "contentValidation")
      .addEdge("contentValidation", END)
      .compile({
        checkpointer: new MemorySaver(),
      });

    // Create a unique thread ID for this generation run
    const threadId = uuidv4();

    // Execute the graph with the initial state and include the thread_id in config
    const result = await graph.invoke(initialState, {
      configurable: {
        thread_id: threadId,
      },
    });

    // Final validation to ensure minimum word count
    let finalContent = result.generatedContent;
    if (countWords(finalContent) < 2000) {
      console.log(
        "Final content still doesn't meet word count requirements. Making one last attempt..."
      );

      const regenerationFn = async () => {
        const model = new ChatOpenAI(MODEL_CONFIG.verbose);

        const finalPrompt = ChatPromptTemplate.fromMessages([
          [
            "system",
            `${systemPrompt}\n\nYou MUST generate content that is AT LEAST 2000 words. This is critical.`,
          ],
          [
            "user",
            `
I need a much more detailed and lengthy ${document} for this product:

${formatProductDetails(product)}

${notes && notes.length > 0 ? "Here are the notes:\n" + formattedNotes + "\n\n" : ""}
${answeredQuestions.length > 0 ? "Here are all Q&As:\n" + formattedQAs : ""}

The previous attempts were too short. Please be VERY detailed and comprehensive.
Expand each section with additional information, analysis, examples, and actionable insights.
The final document MUST exceed 2000 words - this is a strict requirement.
            `,
          ],
        ]);

        return await finalPrompt
          .pipe(model)
          .pipe(new StringOutputParser())
          .invoke({});
      };

      finalContent = await validateWordCount(
        finalContent,
        2000,
        regenerationFn
      );
    }

    return finalContent;
  } catch (error) {
    console.error("Error in LangGraph asset content generation:", error);

    // If there's an error with LangGraph, fall back to the original implementation
    console.log("Falling back to original implementation");
    return generateAssetContent({
      systemPrompt,
      document,
      product,
      questionAnswers,
    });
  }
}

/**
 * Generate asset content using a simplified LangGraph approach
 * This demonstrates the concept of graph-based AI workflows with TypeScript
 */
export async function generateAssetContentWithSimplifiedLangGraph({
  systemPrompt,
  document,
  product,
  questionAnswers,
}: AssetGenerationData): Promise<string> {
  try {
    // Use the utility function to format questions and answers
    const { formattedQAs, answeredQuestions } =
      formatQuestionsAndAnswers(questionAnswers);

    // Create a simplified graph with nodes as functions
    // This approach mimics LangGraph's structure in a more TypeScript-friendly way

    // Define graph node functions
    const nodes = {
      // Node for generating full content
      generateFullContent: async () => {
        const model = new ChatOpenAI(MODEL_CONFIG.standard);

        // Use the unified system prompt
        const unifiedSystemPrompt = createUnifiedSystemPrompt(
          systemPrompt,
          document
        );

        // Create the prompt template with a single system message
        const promptTemplate = ChatPromptTemplate.fromMessages([
          ["system", unifiedSystemPrompt],
          [
            "user",
            `
${formatProductDetails(product)}

Here are all the question/answer pairs available for this product:
${formattedQAs}

Please generate a comprehensive ${document} based on this information.
            `,
          ],
        ]);

        // Create and invoke the chain
        const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

        return await chain.invoke({});
      },
    };

    return await nodes.generateFullContent();
  } catch (error) {
    console.error(
      "Error in simplified LangGraph asset content generation:",
      error
    );
    throw error;
  }
}
