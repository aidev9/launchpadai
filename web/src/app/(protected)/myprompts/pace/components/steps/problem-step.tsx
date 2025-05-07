"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { readStreamableValue } from "ai/rsc";
import { SuggestionButton } from "../suggestion-button";
import { DefinitionScore } from "../definition-score";
import { InstructionsBox } from "../instructions-box";
import { AnimatedMDEditor, AnimatedMDEditorRef } from "../animated-md-editor";
import {
  paceWizardStateAtom,
  problemSuggestionsAtom,
  suggestionsLoadingAtom,
  updatePaceFieldAtom,
  ProblemSuggestion,
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previousContent, setPreviousContent] = useState<string>("");
  const [canUndo, setCanUndo] = useState(false);
  const editorRef = useRef<AnimatedMDEditorRef>(null);

  // Reset animation flag after animation completes
  useEffect(() => {
    if (showEditorAnimation) {
      const timer = setTimeout(() => {
        setShowEditorAnimation(false);
      }, 5500); // Slightly longer than the animation duration
      return () => clearTimeout(timer);
    }
  }, [showEditorAnimation]);

  // Focus on the editor when the component mounts
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Generate suggestions on page load if there's already content in the MDEditor
  useEffect(() => {
    if (wizardState.problem.trim() && suggestions.length === 0) {
      handleGenerateSuggestions();
    }
  }, []);

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
        // Make scoring less generous - cap at 70 instead of 99
        let score = Math.min(
          Math.floor(wordCount / 8) + // 1 point per 8 words (was 5)
            sentenceCount * 2 + // 2 points per sentence (was 3)
            paragraphCount * 3, // 3 points per paragraph (was 5)
          70 // Cap at 70 (was 99)
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

  // CSS class for the animated sparkle icon
  const sparkleIconClass = cn(
    "h-4 w-4 mr-1",
    "transition-transform duration-300",
    "hover:animate-spin",
    isGenerating && "animate-spin"
  );

  // Generate suggestions based on the current problem text
  const handleGenerateSuggestions = async () => {
    if (!wizardState.problem.trim() || isLoading) return;

    setIsLoading(true);
    setIsGenerating(true);
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
        try {
          // Parse the JSON response
          const jsonResponse = JSON.parse(fullOutput);

          // Validate and set the suggestions
          if (
            jsonResponse.suggestions &&
            Array.isArray(jsonResponse.suggestions)
          ) {
            setSuggestions(jsonResponse.suggestions);
          } else {
            console.error("Invalid suggestions format:", jsonResponse);
            setSuggestions([]);
          }
        } catch (jsonError) {
          console.error("Error parsing suggestions JSON:", jsonError);
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Debounced handler for editor changes
  const handleEditorChange = (value?: string) => {
    // Update the field immediately
    updateField({
      problem: value || "",
      unifiedPrompt: value || "",
    });

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer if there's content
    if (value && value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleGenerateSuggestions();
      }, 5000); // 5 seconds debounce
    }
  };

  // Handle blur event on the editor
  const handleEditorBlur = () => {
    if (wizardState.problem.trim() && suggestions.length === 0) {
      handleGenerateSuggestions();
    }
  };

  // Handle undo action
  const handleUndo = () => {
    if (previousContent) {
      // Restore the previous content
      updateField({
        problem: previousContent,
        unifiedPrompt: previousContent,
      });

      // Trigger the animation
      setShowEditorAnimation(true);

      // Reset the undo state
      setPreviousContent("");
      setCanUndo(false);
    }
  };

  // Apply a suggestion with AI enhancement
  const handleApplySuggestion = async (suggestion: ProblemSuggestion) => {
    setIsEnhancing(true);

    // Save the current content for undo
    const currentContent =
      wizardState.unifiedPrompt.trim() || wizardState.problem.trim();
    setPreviousContent(currentContent);
    setCanUndo(true);
    try {
      // Extract the suggestion label and body
      const suggestionType = suggestion.label;
      const suggestionContent = suggestion.body;

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
        // Ensure the score never goes down after using AI
        const currentScore = wizardState.definitionScore || 0;
        updateField({ definitionScore: Math.max(newScore, currentScore) });
      } catch (error) {
        console.error("Error calculating definition score:", error);
      } finally {
        setIsScoreLoading(false);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    } finally {
      setIsEnhancing(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column - Suggestions */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">AI Suggestions</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo || isLoading || isEnhancing}
              className="flex items-center gap-1 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200"
              title="Undo last change"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              <span>Undo</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSuggestions}
              disabled={isLoading || !wizardState.problem.trim()}
              className="flex items-center gap-1 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className={sparkleIconClass} />
              )}
              <span>{isLoading ? "Generating..." : "Generate"}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2 min-h-[380px] h-[380px] overflow-y-auto">
          {isLoading || isEnhancing ? (
            <div className="flex items-center justify-center h-[380px]">
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

        {/* Tips box moved to left column */}
        <div className="bg-muted p-4 rounded-md mt-6">
          <h4 className="font-medium">Tips for a good problem statement:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>Be specific about what you're trying to achieve</li>
            <li>Include relevant context and constraints</li>
            <li>Avoid vague or ambiguous language</li>
            <li>Focus on the problem, not the solution</li>
            <li>Consider who will be using the prompt and for what purpose</li>
          </ul>
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
            onChange={handleEditorChange}
            onBlur={handleEditorBlur}
            ref={editorRef}
            height={640}
            preview="edit"
            showAnimation={showEditorAnimation}
            autoFocus={true}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Clearly define the problem you're trying to solve. What are you
            trying to achieve? What context is important? Be as specific as
            possible.
          </p>
        </div>

        {/* Instructions Box */}
        <InstructionsBox />
      </div>
    </div>
  );
}
