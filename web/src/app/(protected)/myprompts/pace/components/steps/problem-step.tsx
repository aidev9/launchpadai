"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { readStreamableValue } from "ai/rsc";
import { SuggestionButton } from "../suggestion-button";
import { DefinitionScore } from "../definition-score";
import { InstructionsBox } from "../instructions-box";
import { AnimatedMDEditor } from "../animated-md-editor";
import {
  paceWizardStateAtom,
  problemSuggestionsAtom,
  suggestionsLoadingAtom,
  updatePaceFieldAtom,
} from "@/lib/store/pace-store";
import {
  generateProblemSuggestions,
  testPrompt,
  calculatePrecisionScore,
} from "../../actions";

export function ProblemStep() {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [suggestions, setSuggestions] = useAtom(problemSuggestionsAtom);
  const [isLoading, setIsLoading] = useAtom(suggestionsLoadingAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [showEditorAnimation, setShowEditorAnimation] = useState(false);

  // Reset animation flag after animation completes
  useEffect(() => {
    if (showEditorAnimation) {
      const timer = setTimeout(() => {
        setShowEditorAnimation(false);
      }, 5500); // Slightly longer than the animation duration
      return () => clearTimeout(timer);
    }
  }, [showEditorAnimation]);

  // Calculate definition score when the problem text changes
  useEffect(() => {
    const calculateScore = async () => {
      if (!wizardState.problem.trim()) {
        updateField({ definitionScore: 0 });
        return;
      }

      setIsScoreLoading(true);
      try {
        // For demo purposes, calculate a score based on the length and complexity of the problem statement
        const text = wizardState.problem.trim();
        const wordCount = text.split(/\s+/).length;
        const sentenceCount = text
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0).length;
        const paragraphCount = text
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0).length;

        // Calculate score based on content length and structure
        let score = Math.min(
          Math.floor(wordCount / 5) + // 1 point per 5 words
            sentenceCount * 3 + // 3 points per sentence
            paragraphCount * 5, // 5 points per paragraph
          99 // Cap at 99
        );

        // Ensure minimum score of 10 if there's any content
        score = Math.max(score, 10);

        // Update the definition score
        updateField({ definitionScore: score });
      } catch (error) {
        console.error("Error calculating definition score:", error);
      } finally {
        setIsScoreLoading(false);
      }
    };

    // Debounce the score calculation
    const timer = setTimeout(() => {
      calculateScore();
    }, 1000);

    return () => clearTimeout(timer);
  }, [wizardState.problem, updateField]);

  // Generate suggestions based on the current problem text
  const handleGenerateSuggestions = async () => {
    if (!wizardState.problem.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Call the AI service to generate suggestions
      const currentPrompt = wizardState.problem.trim();
      const result = await generateProblemSuggestions(currentPrompt);

      // Process the streamable value
      let fullOutput = "";
      for await (const delta of readStreamableValue(result.output)) {
        fullOutput += delta;
      }

      if (fullOutput) {
        // Split the output into separate suggestions
        const aiSuggestions = fullOutput
          .split("\n")
          .filter((suggestion) => suggestion.trim().length > 0)
          .slice(0, 5); // Ensure we have at most 5 suggestions

        // Format suggestions with appropriate prefixes
        const formattedSuggestions = aiSuggestions.map((suggestion, index) => {
          const prefixes = [
            "Reframe as business challenge",
            "Technical deep dive",
            "User-centered perspective",
            "Scope definition",
            "Risk assessment lens",
          ];

          // Use the prefix if available, otherwise use a generic one
          const prefix =
            index < prefixes.length ? prefixes[index] : "Alternative approach";
          return `${prefix}: "${currentPrompt}" - ${suggestion}`;
        });

        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle blur event on the editor
  const handleEditorBlur = () => {
    if (wizardState.problem.trim() && suggestions.length === 0) {
      handleGenerateSuggestions();
    }
  };

  // Apply a suggestion with AI enhancement
  const handleApplySuggestion = async (suggestion: string) => {
    setIsEnhancing(true);
    try {
      // Extract the suggestion type from the suggestion text
      const suggestionType = suggestion.split(":")[0];

      // Extract the actual suggestion content
      const suggestionContent = suggestion.split(" - ")[1] || "";

      // Get the current prompt content - use unifiedPrompt if available, otherwise use problem
      const currentPrompt =
        wizardState.unifiedPrompt.trim() || wizardState.problem.trim();

      // Call the AI service with both the original prompt and the suggestion type
      const result = await testPrompt(
        currentPrompt,
        suggestionType,
        suggestionContent
      );

      if (!result.output) {
        throw new Error("Failed to get AI response for suggestion");
      }

      // The AI now returns a complete enhanced prompt that incorporates the original content
      const enhancedPrompt = result.output;

      // Update both the problem field and the unified prompt with the enhanced prompt
      updateField({
        problem: enhancedPrompt,
        unifiedPrompt: enhancedPrompt,
      });

      // Trigger the animation
      setShowEditorAnimation(true);

      // Generate new suggestions based on the enhanced prompt
      handleGenerateSuggestions();

      // Calculate a new definition score based on the enhanced prompt
      setIsScoreLoading(true);
      try {
        // Use the calculatePrecisionScore function to get a real score
        const newScore = await calculatePrecisionScore(enhancedPrompt);
        updateField({ definitionScore: newScore });
      } catch (error) {
        console.error("Error calculating definition score:", error);
      } finally {
        setIsScoreLoading(false);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column - Suggestions */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">AI Suggestions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={isLoading || !wizardState.problem.trim()}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            <span>{isLoading ? "Generating..." : "Generate"}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading || isEnhancing ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                {isEnhancing
                  ? "Enhancing prompt..."
                  : "Generating suggestions..."}
              </span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <SuggestionButton
                key={index}
                suggestion={suggestion}
                onApply={handleApplySuggestion}
                maxPreviewLength={40}
              />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4 border rounded-md">
              {wizardState.problem.trim()
                ? "Click the refresh button to generate suggestions"
                : "Enter a problem description to get suggestions"}
            </div>
          )}
        </div>

        {/* Definition Score */}
        <div className="mt-6">
          {isScoreLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DefinitionScore score={wizardState.definitionScore} />
          )}
        </div>
      </div>

      {/* Right column - Problem editor */}
      <div className="md:col-span-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="problem">Problem Description</Label>
          <AnimatedMDEditor
            value={
              wizardState.unifiedPrompt.trim()
                ? wizardState.unifiedPrompt
                : typeof wizardState.problem === "string"
                  ? wizardState.problem
                  : String(wizardState.problem)
            }
            onChange={(value) =>
              updateField({
                problem: value || "",
                unifiedPrompt: value || "",
              })
            }
            onBlur={handleEditorBlur}
            height={300}
            preview="edit"
            showAnimation={showEditorAnimation}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Clearly define the problem you're trying to solve. What are you
            trying to achieve? What context is important? Be as specific as
            possible.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h4 className="font-medium">Tips for a good problem statement:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>Be specific about what you're trying to achieve</li>
            <li>Include relevant context and constraints</li>
            <li>Avoid vague or ambiguous language</li>
            <li>Focus on the problem, not the solution</li>
            <li>Consider who will be using the prompt and for what purpose</li>
          </ul>
        </div>

        {/* Instructions Box */}
        <InstructionsBox />
      </div>
    </div>
  );
}
