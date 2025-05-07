"use server";

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";
import { Message } from "ai";
import { AIModelSettings } from "@/app/(protected)/prompts/prompt/actions";

// Default settings for AI model
const defaultSettings: AIModelSettings = {
  modelId: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};

/**
 * System prompt for problem statement enhancement
 */
const PROBLEM_ENHANCEMENT_SYSTEM_PROMPT = `You are an expert at helping users define problems clearly for AI prompts.
Your goal is to help the user refine their problem statement to be more specific, clear, and actionable.

When enhancing problem statements, follow these guidelines:
1. Identify the core problem or goal
2. Add relevant context that might be missing
3. Remove ambiguity and vagueness
4. Make the problem statement more specific and concrete
5. Ensure the problem is framed in a way that leads to actionable solutions

Provide 5 different suggestions for improving the problem statement, each taking a slightly different approach.
Each suggestion should have a label that describes the approach and a body that contains the actual suggestion.

Your response must be a valid JSON object with the following structure:
{
  "suggestions": [
    {
      "label": "Short descriptive label for the approach (e.g., 'Business Challenge', 'Technical Perspective')",
      "body": "Complete suggestion text that the user can apply directly"
    },
    // ... 4 more suggestions with the same structure
  ]
}

Make each suggestion distinct and valuable in its own way. The labels should be concise (2-4 words) and descriptive of the approach taken.`;

/**
 * System prompt for ask enhancement
 */
const ASK_ENHANCEMENT_SYSTEM_PROMPT = `You are an expert at crafting precise prompts for AI systems.
Your goal is to help the user refine their prompt to be more effective, clear, and likely to produce the desired results.

When enhancing prompts, follow these guidelines:
1. Add clarity and specificity
2. Include relevant context
3. Specify the desired format or structure of the response
4. Add appropriate constraints or requirements
5. Use clear and unambiguous language
6. Remove unnecessary information

Provide 5 different suggestions for improving the prompt, each taking a slightly different approach.
Each suggestion should have a label that describes the approach and a body that contains the actual suggestion.

Your response must be a valid JSON object with the following structure:
{
  "suggestions": [
    {
      "label": "Short descriptive label for the approach (e.g., 'Format-focused', 'Analytical approach')",
      "body": "Complete suggestion text that the user can apply directly"
    },
    // ... 4 more suggestions with the same structure
  ]
}

Make each suggestion distinct and valuable in its own way. The labels should be concise (2-4 words) and descriptive of the approach taken.`;

/**
 * System prompt for chain variations
 */
const CHAIN_VARIATIONS_SYSTEM_PROMPT = `You are an expert at creating effective prompt chains for AI systems.
Your goal is to help the user create a comprehensive sequence of prompts that build on each other to produce sophisticated, multi-step reasoning.

A prompt chain is a powerful sequence of prompts where the output of one prompt becomes the input for the next.
This approach allows for more complex reasoning, deeper analysis, and refined results that wouldn't be possible with a single prompt.

Based on the user's prompt (which we'll call the "initial prompt"), create a detailed 2-step chain:

1. First, create "Chain 1" - a comprehensive prompt that would logically follow the initial prompt in a sequence.
   This should be designed as the next prompt that would use the output from the initial prompt as its input.
   Focus on analysis, breakdown, or processing of the initial output.
   Include specific instructions, formatting requirements, and clear expectations.
   Make this prompt at least 150-200 words with multiple sections and detailed guidance.
   
2. Then, create "Chain 2" - another detailed prompt that would follow Chain 1 in the sequence.
   This should be designed to use the output from Chain 1 as its input.
   Focus on synthesis, application, evaluation, or refinement of Chain 1's output.
   Include specific instructions, formatting requirements, and clear expectations.
   Make this prompt at least 150-200 words with multiple sections and detailed guidance.

Format your response with two clearly labeled sections:

Chain 1:
[A complete, detailed prompt (150-200+ words) that would follow the initial prompt in a sequence. Include multiple sections with headings, specific instructions, and formatting requirements.]

Chain 2:
[A complete, detailed prompt (150-200+ words) that would follow Chain 1 in the sequence. Include multiple sections with headings, specific instructions, and formatting requirements.]

For each chain prompt:
- Include a clear title/heading
- Provide context about how it relates to the previous prompt
- Specify the expected input (what you expect from the previous step)
- Detail the required analysis or processing
- Specify the desired output format with examples
- Include any constraints or requirements
- Use markdown formatting with sections, bullet points, and emphasis where appropriate`;

/**
 * System prompt for precision score calculation
 */
const PRECISION_SCORE_SYSTEM_PROMPT = `You are an expert at evaluating the precision and effectiveness of prompts for AI systems.
Your goal is to analyze the given prompt and assign a precision score from 0 to 100.

When evaluating prompts, consider these factors:
1. Clarity: Is the prompt clear and unambiguous?
2. Specificity: Does the prompt include specific details and requirements?
3. Context: Does the prompt provide necessary context?
4. Structure: Does the prompt request a specific format or structure for the response?
5. Constraints: Does the prompt include appropriate constraints or requirements?
6. Purpose: Is the goal or purpose of the prompt clear?

Assign a score from 0 to 70 based on these factors, where:
- 0-15: Very poor (vague, ambiguous, lacking context)
- 16-30: Poor (unclear, minimal specificity)
- 31-45: Average (somewhat clear but could be improved)
- 46-60: Good (clear, specific, with some context)
- 61-70: Excellent (very clear, highly specific, well-structured)

Be conservative in your scoring. Most prompts should fall in the 30-50 range unless they are exceptionally well-crafted.

Respond with ONLY a number between 0 and 70. Do not include any explanation or additional text.`;

/**
 * Generate suggestions for improving a problem statement
 */
export async function generateProblemSuggestions(problemText: string) {
  // Create a streamable value for the output
  const stream = createStreamableValue("");

  // Start streaming in the background
  (async () => {
    try {
      const messages: Omit<Message, "id">[] = [
        { role: "system", content: PROBLEM_ENHANCEMENT_SYSTEM_PROMPT },
        { role: "user", content: problemText },
      ];

      const result = await streamText({
        model: openai(defaultSettings.modelId),
        messages,
        temperature: defaultSettings.temperature,
        maxTokens: defaultSettings.maxTokens,
        topP: defaultSettings.topP,
      });

      // Collect the full response instead of streaming deltas
      let fullResponse = "";
      for await (const delta of result.textStream) {
        fullResponse += delta;
      }

      // Try to parse the response as JSON
      try {
        // Ensure the response is valid JSON
        const jsonResponse = JSON.parse(fullResponse);

        // Validate the structure
        if (
          !jsonResponse.suggestions ||
          !Array.isArray(jsonResponse.suggestions)
        ) {
          throw new Error(
            "Invalid response structure: missing suggestions array"
          );
        }

        // Stream the validated JSON response
        stream.update(JSON.stringify(jsonResponse));
        stream.done();
      } catch (jsonError) {
        console.error("Error parsing AI response as JSON:", jsonError);

        // Fallback: Try to convert plain text response to JSON format
        try {
          const lines = fullResponse
            .split("\n")
            .filter((line) => line.trim().length > 0);
          const suggestions = lines.slice(0, 5).map((line, index) => {
            // Use default labels if we can't parse JSON
            const defaultLabels = [
              "Business Challenge",
              "Technical Perspective",
              "User-Centered View",
              "Scope Definition",
              "Risk Assessment",
            ];
            return {
              label:
                index < defaultLabels.length
                  ? defaultLabels[index]
                  : `Suggestion ${index + 1}`,
              body: line.trim(),
            };
          });

          stream.update(JSON.stringify({ suggestions }));
          stream.done();
        } catch (fallbackError) {
          stream.error("Failed to parse AI response as JSON");
        }
      }
    } catch (error) {
      console.error("Error generating problem suggestions:", error);
      stream.error(
        "Failed to generate suggestions: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  })();

  // Return the streamable value for UI consumption
  return { output: stream.value };
}

/**
 * Generate suggestions for improving an ask/prompt
 */
export async function generateAskSuggestions(askText: string) {
  // Create a streamable value for the output
  const stream = createStreamableValue("");

  // Start streaming in the background
  (async () => {
    try {
      const messages: Omit<Message, "id">[] = [
        { role: "system", content: ASK_ENHANCEMENT_SYSTEM_PROMPT },
        { role: "user", content: askText },
      ];

      const result = await streamText({
        model: openai(defaultSettings.modelId),
        messages,
        temperature: defaultSettings.temperature,
        maxTokens: defaultSettings.maxTokens,
        topP: defaultSettings.topP,
      });

      // Collect the full response instead of streaming deltas
      let fullResponse = "";
      for await (const delta of result.textStream) {
        fullResponse += delta;
      }

      // Try to parse the response as JSON
      try {
        // Ensure the response is valid JSON
        const jsonResponse = JSON.parse(fullResponse);

        // Validate the structure
        if (
          !jsonResponse.suggestions ||
          !Array.isArray(jsonResponse.suggestions)
        ) {
          throw new Error(
            "Invalid response structure: missing suggestions array"
          );
        }

        // Stream the validated JSON response
        stream.update(JSON.stringify(jsonResponse));
        stream.done();
      } catch (jsonError) {
        console.error("Error parsing AI response as JSON:", jsonError);

        // Fallback: Try to convert plain text response to JSON format
        try {
          const lines = fullResponse
            .split("\n")
            .filter((line) => line.trim().length > 0);
          const suggestions = lines.slice(0, 5).map((line, index) => {
            // Use default labels if we can't parse JSON
            const defaultLabels = [
              "Format-focused",
              "Analytical approach",
              "Creative exploration",
              "Step-by-step guide",
              "Comparative framework",
            ];
            return {
              label:
                index < defaultLabels.length
                  ? defaultLabels[index]
                  : `Suggestion ${index + 1}`,
              body: line.trim(),
            };
          });

          stream.update(JSON.stringify({ suggestions }));
          stream.done();
        } catch (fallbackError) {
          stream.error("Failed to parse AI response as JSON");
        }
      }
    } catch (error) {
      console.error("Error generating ask suggestions:", error);
      stream.error(
        "Failed to generate suggestions: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  })();

  // Return the streamable value for UI consumption
  return { output: stream.value };
}

/**
 * Generate chain variations for a prompt
 */
export async function generateChainVariations(promptText: string) {
  try {
    // Create a more detailed user message that emphasizes the importance of the original prompt
    const userContent = `Original prompt: "${promptText}"\n\nCreate a detailed 2-step prompt chain that builds on this initial prompt. Make each chain prompt comprehensive (150-200+ words) with multiple sections, specific instructions, and clear formatting requirements.`;

    const messages: Omit<Message, "id">[] = [
      { role: "system", content: CHAIN_VARIATIONS_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];

    // Use the same pattern as streamText but collect the full response
    // Increase maxTokens to allow for more detailed responses
    const result = await streamText({
      model: openai(defaultSettings.modelId),
      messages,
      temperature: defaultSettings.temperature,
      maxTokens: 3072, // Increased token limit for more detailed responses
      topP: defaultSettings.topP,
    });

    // Collect the full response instead of streaming
    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    // Return the complete output
    return { output: fullResponse };
  } catch (error) {
    console.error("Error generating chain variations:", error);
    return {
      error:
        "Failed to generate chain variations: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Calculate precision score for a prompt
 */
export async function calculatePrecisionScore(
  promptText: string
): Promise<number> {
  try {
    const messages: Omit<Message, "id">[] = [
      { role: "system", content: PRECISION_SCORE_SYSTEM_PROMPT },
      { role: "user", content: promptText },
    ];

    const result = await streamText({
      model: openai(defaultSettings.modelId),
      messages,
      temperature: 0.3, // Lower temperature for more consistent scoring
      maxTokens: 10, // We only need a number
    });

    // Collect the full response
    let scoreText = "";
    for await (const chunk of result.textStream) {
      scoreText += chunk;
    }

    // Parse the score from the response
    scoreText = scoreText.trim();
    const score = parseInt(scoreText, 10);

    // Return the score, or 35 if parsing fails
    // Cap the score at 70 instead of 100
    return isNaN(score) ? 35 : Math.max(0, Math.min(70, score));
  } catch (error) {
    console.error("Error calculating precision score:", error);
    // Return a default score if there's an error (lowered from 50 to 35)
    return 35;
  }
}

/**
 * Test a prompt with the AI model
 */
export async function testPrompt(
  originalPrompt: string,
  suggestionType: string,
  suggestionContent?: string
) {
  try {
    // Create a system prompt based on the suggestion type
    let systemPrompt =
      "You are an expert at enhancing prompts to make them more effective. Provide a detailed, well-structured response in Markdown format. Use headings, bullet points, and other formatting to make your response clear and organized. Be comprehensive and thorough in your enhancement of the prompt. IMPORTANT: Do NOT include any prefacing text like 'Enhanced Prompt' or 'Enhanced Prompt for [topic]'. Do NOT include the original prompt or any sections labeled 'Original Prompt'. Start directly with the enhanced prompt content.";

    switch (suggestionType) {
      case "Format-focused":
        systemPrompt +=
          " Focus on improving the structure and format of the output. Add specific formatting instructions that will make the response more organized and easier to understand.";
        break;
      case "Analytical approach":
        systemPrompt +=
          " Focus on adding analytical depth to the prompt. Include requirements for multiple perspectives, evidence-based analysis, and critical evaluation.";
        break;
      case "Creative exploration":
        systemPrompt +=
          " Focus on encouraging creative and innovative thinking. Add instructions for generating unconventional ideas and exploring unexpected connections.";
        break;
      case "Step-by-step guide":
        systemPrompt +=
          " Focus on breaking down the process into clear, sequential steps. Add instructions for detailed guidance at each stage with examples.";
        break;
      case "Comparative framework":
        systemPrompt +=
          " Focus on comparing different approaches or methodologies. Add instructions for evaluating strengths, limitations, and appropriate use cases.";
        break;
      case "Reframe as business challenge":
        systemPrompt +=
          " Focus on business impact, ROI, stakeholder needs, and success metrics. Frame the problem in terms of business objectives and outcomes.";
        break;
      case "Technical deep dive":
        systemPrompt +=
          " Focus on technical constraints, system architecture, and implementation details. Include specific technical requirements and considerations.";
        break;
      case "User-centered perspective":
        systemPrompt +=
          " Focus on user needs, pain points, accessibility, and experience goals. Emphasize how the solution will benefit end users.";
        break;
      case "Scope definition":
        systemPrompt +=
          " Focus on clearly defining boundaries, success metrics, and project phases. Specify what's in-scope and out-of-scope.";
        break;
      case "Risk assessment lens":
        systemPrompt +=
          " Focus on identifying potential risks, failure modes, and mitigation strategies. Consider security, compliance, and operational concerns.";
        break;
      case "evaluate":
        // For evaluate step, we're not enhancing the prompt but executing it directly
        systemPrompt =
          "You are a helpful AI assistant responding to the user's prompt.";
        break;
      default:
        systemPrompt +=
          " Enhance the prompt to be more specific, clear, and likely to produce the desired results.";
    }

    // Create the user message with context about what we're trying to do
    let userContent;

    if (suggestionType === "evaluate") {
      // For evaluate step, just pass the original prompt directly
      userContent = originalPrompt;
    } else {
      // For enhancement steps, create a message about enhancing the prompt
      userContent = suggestionContent
        ? `Original prompt: "${originalPrompt}"\n\nEnhance this prompt using a ${suggestionType} approach. Incorporate the original prompt and add specific instructions for ${suggestionContent}`
        : `Enhance this prompt using a ${suggestionType} approach: "${originalPrompt}"`;
    }

    const messages: Omit<Message, "id">[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    // Use the same pattern as streamText but collect the full response
    const result = await streamText({
      model: openai("gpt-4o-mini"), // Specifically use gpt-4o-mini model
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Collect the full response instead of streaming
    let fullResponse = "";
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    // Return the complete output
    return { output: fullResponse };
  } catch (error) {
    console.error("Error testing prompt:", error);
    return {
      error:
        "Failed to test prompt: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
