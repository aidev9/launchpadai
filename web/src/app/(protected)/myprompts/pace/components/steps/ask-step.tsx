"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { readStreamableValue } from "ai/rsc";
import { SuggestionButton } from "../suggestion-button";
import { PrecisionScore } from "../precision-score";
import { InstructionsBox } from "../instructions-box";
import { AnimatedMDEditor, AnimatedMDEditorRef } from "../animated-md-editor";
import {
  paceWizardStateAtom,
  askSuggestionsAtom,
  suggestionsLoadingAtom,
  updatePaceFieldAtom,
  AskSuggestion,
} from "@/lib/store/pace-store";
import {
  calculatePrecisionScore,
  generateAskSuggestions,
  testPrompt,
} from "../../actions";
import { useToast } from "@/components/ui/use-toast";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";

export function AskStep() {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [suggestions, setSuggestions] = useAtom(askSuggestionsAtom);
  const [isLoading, setIsLoading] = useAtom(suggestionsLoadingAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEditorAnimation, setShowEditorAnimation] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previousContent, setPreviousContent] = useState<string>("");
  const [canUndo, setCanUndo] = useState(false);
  const editorRef = useRef<AnimatedMDEditorRef>(null);
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);
  const { toast } = useToast();

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

  // Initialize ask field with problem field when component mounts
  useEffect(() => {
    // Only initialize if ask is empty and problem is not empty
    if (!wizardState.ask.trim() && wizardState.problem.trim()) {
      updateField({ ask: wizardState.problem });
      // Trigger animation when initializing
      setShowEditorAnimation(true);
    }
  }, []);

  // Generate suggestions on page load if there's already content in the MDEditor
  useEffect(() => {
    if (wizardState.ask.trim() && suggestions.length === 0) {
      handleGenerateSuggestions();
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

  // CSS class for the animated sparkle icon
  const sparkleIconClass = cn(
    "h-4 w-4 mr-1",
    "transition-transform duration-300",
    "hover:animate-spin",
    isGenerating && "animate-spin"
  );

  // Generate suggestions based on the current ask text
  const handleGenerateSuggestions = async () => {
    if (!wizardState.ask.trim() || isLoading) return;

    setIsLoading(true);
    setIsGenerating(true);

    // Optimistically update credit count
    if (promptCredits) {
      setPromptCredits({
        ...promptCredits,
        remainingCredits: Math.max(0, promptCredits.remainingCredits - 1),
      });
    }

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

      // Fetch updated credit count
      const creditsResponse = await fetchPromptCredits();
      if (creditsResponse.success && creditsResponse.credits) {
        setPromptCredits(creditsResponse.credits);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Debounced handler for editor changes
  const handleEditorChange = (value?: string) => {
    // Update the field immediately
    updateField({
      ask: value || "",
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
    if (wizardState.ask.trim() && suggestions.length === 0) {
      handleGenerateSuggestions();
    }
  };

  // Handle undo action
  const handleUndo = () => {
    if (previousContent) {
      // Restore the previous content
      updateField({
        ask: previousContent,
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
  const handleApplySuggestion = async (suggestion: AskSuggestion) => {
    setIsEnhancing(true);

    // Optimistically update credit count
    if (promptCredits) {
      setPromptCredits({
        ...promptCredits,
        remainingCredits: Math.max(0, promptCredits.remainingCredits - 1),
      });
    }

    // Save the current content for undo
    const currentContent =
      wizardState.unifiedPrompt.trim() || wizardState.ask.trim();
    setPreviousContent(currentContent);
    setCanUndo(true);
    try {
      // Extract the suggestion label and body
      const suggestionType = suggestion.label;
      const suggestionContent = suggestion.body;

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
        // Ensure the score never goes down after using AI
        const currentScore = wizardState.precisionScore || 0;
        updateField({ precisionScore: Math.max(newScore, currentScore) });
      } catch (error) {
        console.error("Error calculating precision score:", error);
      } finally {
        setIsScoreLoading(false);
      }

      // Fetch updated credit count
      const creditsResponse = await fetchPromptCredits();
      if (creditsResponse.success && creditsResponse.credits) {
        setPromptCredits(creditsResponse.credits);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      toast({
        title: "Error",
        description: "Failed to enhance prompt. Please try again.",
        variant: "destructive",
      });
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
              disabled={isLoading || !wizardState.ask.trim()}
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

        {/* Tips box moved to left column */}
        <div className="bg-muted p-4 rounded-md mt-6">
          <h4 className="font-medium">Tips for a precise prompt:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>Be specific about the format you want</li>
            <li>Include relevant constraints or requirements</li>
            <li>Specify the tone, style, or perspective</li>
            <li>Break complex requests into clear steps</li>
            <li>Provide examples if possible</li>
          </ul>
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
            onChange={handleEditorChange}
            onBlur={handleEditorBlur}
            height={640}
            preview="edit"
            showAnimation={showEditorAnimation}
            autoFocus={true}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Craft a precise prompt that clearly communicates your intent. Be
            specific about what you want and how you want it.
          </p>
        </div>

        {/* Instructions Box */}
        <InstructionsBox />
      </div>
    </div>
  );
}
