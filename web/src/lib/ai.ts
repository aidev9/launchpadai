"use server";

import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { type Product } from "@/lib/store/product-store";
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
  notes?: { id: string; note_body: string; last_modified: string }[];
  asset?: {
    title: string;
    description: string;
    phase: string;
    systemPrompt: string;
  };
}

/**
 * State annotation for the LangGraph asset generation workflow
 */
const AssetGenerationStateAnnotation = Annotation.Root({
  systemPrompt: Annotation<string>(),
  document: Annotation<string>(),
  product: Annotation<Product>(),
  questionAnswers: Annotation<QuestionAnswer[]>(),
  notes:
    Annotation<{ id: string; note_body: string; last_modified: string }[]>(),
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
 * Generate asset content using LangChain
 */
export async function generateAssetContent({
  systemPrompt,
  document,
  product,
  questionAnswers,
}: AssetGenerationData): Promise<string> {
  try {
    // Filter out questions that don't have answers
    const answeredQuestions = questionAnswers.filter(
      (qa) => qa.answer && qa.answer.trim() !== ""
    );

    // Use default content if no answered questions
    if (answeredQuestions.length === 0) {
      // Create a simple model for fallback
      const fallbackModel = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.7,
      });

      // Use messages directly instead of ChatPromptTemplate for simplicity
      const systemMessage = {
        role: "system" as const,
        content: `
You are generating a ${document} for a startup with limited information.
Use the provided product details to create a basic document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.`,
      };

      const userMessage = {
        role: "user" as const,
        content: `
Generate a basic ${document} for a product with these details:

Product Name: ${product.name || "Unnamed Product"}
Product Description: ${product.description || "Not provided"}
Problem: ${product.problem || "Not provided"}
Team: ${product.team || "Not provided"}
Website: ${product.website || "Not provided"}
Country: ${product.country || "Not provided"}
Stage: ${product.stage || "Not provided"}

Note: This is a preliminary version as no detailed Q&A information is available yet.`,
      };

      // Invoke the model with messages
      const response = await fallbackModel.invoke([systemMessage, userMessage]);

      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response);
    }

    // Format the question/answers for the model input
    const formattedQAs = answeredQuestions
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    // Create the model
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Create the system prompt including the document-specific prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      [
        "system",
        `
You are generating a ${document} for a startup. 
Use the provided product details and question/answer pairs to create a comprehensive document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.
      `,
      ],
      [
        "user",
        `
Product Name: {product_name}
Product Description: {product_description}
Problem: {product_problem}
Team: {product_team}
Website: {product_website}
Country: {product_country}
Stage: {product_stage}

Here are all the question/answer pairs available for this product:
{question_answers}

Please generate a comprehensive ${document} based on this information.
      `,
      ],
    ]);

    // Create the chain
    const chain = RunnableSequence.from([
      {
        product_name: async () => product.name || "Unnamed Product",
        product_description: async () => product.description || "Not provided",
        product_problem: async () => product.problem || "Not provided",
        product_team: async () => product.team || "Not provided",
        product_website: async () => product.website || "Not provided",
        product_country: async () => product.country || "Not provided",
        product_stage: async () => product.stage || "Not provided",
        question_answers: async () => formattedQAs,
      },
      promptTemplate,
      model,
    ]);

    // Generate the content
    const response = await chain.invoke({});

    // Extract the content
    const generatedContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response);

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
    // Filter out questions that don't have answers
    const answeredQuestions = questionAnswers.filter(
      (qa) => qa.answer && qa.answer.trim() !== ""
    );

    // Format the notes for the model input (if any)
    const formattedNotes =
      notes.length > 0
        ? notes.map((note) => `Note: ${note.note_body}`).join("\n\n")
        : "";

    // Format the question/answers for the model input
    const formattedQAs =
      answeredQuestions.length > 0
        ? answeredQuestions
            .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
            .join("\n\n")
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
     * Determines whether to use normal or fallback flow based on available data
     */
    const determineGenerationPath = (
      state: typeof AssetGenerationStateAnnotation.State
    ) => {
      if (state.hasNotes || state.hasAnsweredQuestions) {
        return "fullContentGeneration";
      }
      return "fallbackContentGeneration";
    };

    /**
     * Generates content using the fallback approach (minimal information)
     */
    const generateFallbackContent = async (
      state: typeof AssetGenerationStateAnnotation.State
    ) => {
      const fallbackModel = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.7,
      });

      const systemMessage = {
        role: "system" as const,
        content: `
You are generating a ${state.document} for a startup with limited information.
Use the provided product details to create a basic document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.

Asset Information:
Title: ${state.asset?.title || state.document}
Description: ${state.asset?.description || "Not provided"}
Phase: ${state.asset?.phase || "Not provided"}
${state.asset?.systemPrompt ? `Additional Instructions: ${state.asset.systemPrompt}` : ""}`,
      };

      const userMessage = {
        role: "user" as const,
        content: `
Generate a basic ${state.document} for a product with these details:

Product Name: ${state.product.name || "Unnamed Product"}
Product Description: ${state.product.description || "Not provided"}
Problem: ${state.product.problem || "Not provided"}
Team: ${state.product.team || "Not provided"}
Website: ${state.product.website || "Not provided"}
Country: ${state.product.country || "Not provided"}
Stage: ${state.product.stage || "Not provided"}

Note: This is a preliminary version as no detailed Q&A information is available yet.`,
      };

      const response = await fallbackModel.invoke([systemMessage, userMessage]);

      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response);

      return {
        generatedContent: content,
      };
    };

    /**
     * Generates comprehensive content using notes, Q&A data and product information
     */
    const generateFullContent = async (
      state: typeof AssetGenerationStateAnnotation.State
    ) => {
      const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.7,
      });

      // Create the prompt template
      const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", state.systemPrompt],
        [
          "system",
          `
You are generating a ${state.document} for a startup. 
Use the provided product details, notes, and question/answer pairs to create a comprehensive document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.
If notes are provided, they take precedence over question/answer pairs.

Asset Information:
Title: ${state.asset?.title || state.document}
Description: ${state.asset?.description || "Not provided"}
Phase: ${state.asset?.phase || "Not provided"}
${state.asset?.systemPrompt ? `Additional Instructions: ${state.asset.systemPrompt}` : ""}
          `,
        ],
        [
          "user",
          `
Product Name: ${state.product.name || "Unnamed Product"}
Product Description: ${state.product.description || "Not provided"}
Problem: ${state.product.problem || "Not provided"}
Team: ${state.product.team || "Not provided"}
Website: ${state.product.website || "Not provided"}
Country: ${state.product.country || "Not provided"}
Stage: ${state.product.stage || "Not provided"}

${state.hasNotes ? "Here are the notes for this product (these take precedence):\n" + state.formattedNotes + "\n\n" : ""}
${state.hasAnsweredQuestions ? "Here are all the question/answer pairs available for this product:\n" + state.formattedQAs : ""}

Please generate a comprehensive ${state.document} based on this information.
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

    // Create the StateGraph
    const graph = new StateGraph(AssetGenerationStateAnnotation)
      .addNode("fallbackContentGeneration", generateFallbackContent)
      .addNode("fullContentGeneration", generateFullContent)
      .addConditionalEdges(START, determineGenerationPath, {
        fallbackContentGeneration: "fallbackContentGeneration",
        fullContentGeneration: "fullContentGeneration",
      })
      .addEdge("fallbackContentGeneration", END)
      .addEdge("fullContentGeneration", END)
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

    return result.generatedContent;
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

    // Create a simplified graph with nodes as functions
    // This approach mimics LangGraph's structure in a more TypeScript-friendly way

    // Define graph node functions
    const nodes = {
      // Node to determine which path to take
      routeContentGeneration: () => {
        return formattedQAs === "" ? "fallback" : "full";
      },

      // Node for generating fallback content
      generateFallbackContent: async () => {
        const fallbackModel = new ChatOpenAI({
          modelName: "gpt-4o-mini",
          temperature: 0.7,
        });

        const systemMessage = {
          role: "system" as const,
          content: `
You are generating a ${document} for a startup with limited information.
Use the provided product details to create a basic document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.`,
        };

        const userMessage = {
          role: "user" as const,
          content: `
Generate a basic ${document} for a product with these details:

Product Name: ${product.name || "Unnamed Product"}
Product Description: ${product.description || "Not provided"}
Problem: ${product.problem || "Not provided"}
Team: ${product.team || "Not provided"}
Website: ${product.website || "Not provided"}
Country: ${product.country || "Not provided"}
Stage: ${product.stage || "Not provided"}

Note: This is a preliminary version as no detailed Q&A information is available yet.`,
        };

        const response = await fallbackModel.invoke([
          systemMessage,
          userMessage,
        ]);

        return typeof response.content === "string"
          ? response.content
          : JSON.stringify(response);
      },

      // Node for generating full content
      generateFullContent: async () => {
        const model = new ChatOpenAI({
          modelName: "gpt-4o-mini",
          temperature: 0.7,
        });

        // Create the prompt template
        const promptTemplate = ChatPromptTemplate.fromMessages([
          ["system", systemPrompt],
          [
            "system",
            `
You are generating a ${document} for a startup. 
Use the provided product details and question/answer pairs to create a comprehensive document.
Format your response using proper Markdown syntax.
Be specific, detailed, and professional.
            `,
          ],
          [
            "user",
            `
Product Name: ${product.name || "Unnamed Product"}
Product Description: ${product.description || "Not provided"}
Problem: ${product.problem || "Not provided"}
Team: ${product.team || "Not provided"}
Website: ${product.website || "Not provided"}
Country: ${product.country || "Not provided"}
Stage: ${product.stage || "Not provided"}

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

    // Execute the graph
    // 1. Determine the path
    const route = nodes.routeContentGeneration();

    // 2. Execute the appropriate node based on the path
    if (route === "fallback") {
      return await nodes.generateFallbackContent();
    } else {
      return await nodes.generateFullContent();
    }
  } catch (error) {
    console.error(
      "Error in simplified LangGraph asset content generation:",
      error
    );
    throw error;
  }
}
