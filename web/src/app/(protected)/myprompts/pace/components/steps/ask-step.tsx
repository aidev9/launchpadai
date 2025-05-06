"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { readStreamableValue } from "ai/rsc";
import { SuggestionButton } from "../suggestion-button";
import { PrecisionScore } from "../precision-score";
import { InstructionsBox } from "../instructions-box";
import { AnimatedMDEditor } from "../animated-md-editor";
import {
  paceWizardStateAtom,
  askSuggestionsAtom,
  suggestionsLoadingAtom,
  updatePaceFieldAtom,
} from "@/lib/store/pace-store";
import {
  calculatePrecisionScore,
  generateAskSuggestions,
  testPrompt,
} from "../../actions";

export function AskStep() {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [suggestions, setSuggestions] = useAtom(askSuggestionsAtom);
  const [isLoading, setIsLoading] = useAtom(suggestionsLoadingAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
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

  // Initialize ask field with problem field when component mounts
  useEffect(() => {
    // Only initialize if ask is empty and problem is not empty
    if (!wizardState.ask.trim() && wizardState.problem.trim()) {
      updateField({ ask: wizardState.problem });
      // Trigger animation when initializing
      setShowEditorAnimation(true);
    }
  }, []);

  // Calculate precision score when the ask text changes
  useEffect(() => {
    const calculateScore = async () => {
      if (!wizardState.ask.trim()) {
        updateField({ precisionScore: 0 });
        return;
      }

      setIsScoreLoading(true);
      try {
        // Call the AI service to calculate the precision score
        const score = await calculatePrecisionScore(wizardState.ask);
        updateField({ precisionScore: score });
      } catch (error) {
        console.error("Error calculating precision score:", error);
      } finally {
        setIsScoreLoading(false);
      }
    };

    // Debounce the score calculation
    const timer = setTimeout(() => {
      calculateScore();
    }, 1000);

    return () => clearTimeout(timer);
  }, [wizardState.ask, updateField]);

  // Generate suggestions based on the current ask text
  const handleGenerateSuggestions = async () => {
    if (!wizardState.ask.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Call the AI service to generate suggestions
      const currentPrompt = wizardState.ask.trim();
      const result = await generateAskSuggestions(currentPrompt);

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
            "Format-focused",
            "Analytical approach",
            "Creative exploration",
            "Step-by-step guide",
            "Comparative framework",
          ];

          // Use the prefix if available, otherwise use a generic one
          const prefix =
            index < prefixes.length ? prefixes[index] : "Enhanced approach";
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
    if (wizardState.ask.trim() && suggestions.length === 0) {
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

      // Use unifiedPrompt if available, otherwise use ask
      const currentPrompt =
        wizardState.unifiedPrompt.trim() || wizardState.ask.trim();

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

      // Update both the ask field and the unified prompt with the enhanced prompt
      updateField({
        ask: enhancedPrompt,
        unifiedPrompt: enhancedPrompt,
      });

      // Trigger the animation
      setShowEditorAnimation(true);

      // Generate new suggestions based on the enhanced prompt
      handleGenerateSuggestions();

      // Calculate a new precision score based on the enhanced prompt
      setIsScoreLoading(true);
      try {
        // Use the calculatePrecisionScore function to get a real score
        const newScore = await calculatePrecisionScore(enhancedPrompt);
        updateField({ precisionScore: newScore });
      } catch (error) {
        console.error("Error calculating precision score:", error);
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
            disabled={isLoading || !wizardState.ask.trim()}
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
              {wizardState.ask.trim()
                ? "Click the refresh button to generate suggestions"
                : "Enter a prompt to get suggestions"}
            </div>
          )}
        </div>

        {/* Precision Score */}
        <div className="mt-6">
          {isScoreLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PrecisionScore score={wizardState.precisionScore} />
          )}
        </div>
      </div>

      {/* Right column - Ask editor */}
      <div className="md:col-span-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ask">Your Prompt</Label>
          <AnimatedMDEditor
            value={
              wizardState.unifiedPrompt.trim()
                ? wizardState.unifiedPrompt
                : typeof wizardState.ask === "string"
                  ? wizardState.ask
                  : String(wizardState.ask)
            }
            onChange={(value) =>
              updateField({
                ask: value || "",
                unifiedPrompt: value || "",
              })
            }
            onBlur={handleEditorBlur}
            height={300}
            preview="edit"
            showAnimation={showEditorAnimation}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Craft a precise prompt that clearly communicates your intent. Be
            specific about what you want and how you want it.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h4 className="font-medium">Tips for a precise prompt:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>Be specific about the format you want</li>
            <li>Include relevant constraints or requirements</li>
            <li>Specify the tone, style, or perspective</li>
            <li>Break complex requests into clear steps</li>
            <li>Provide examples if possible</li>
          </ul>
        </div>

        {/* Instructions Box */}
        <InstructionsBox />
      </div>
    </div>
  );
}
