"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
  paceWizardStateAtom,
  updatePaceFieldAtom,
} from "@/lib/store/pace-store";
import { enhancePromptStream } from "@/app/(protected)/prompts/prompt/actions";
import { generateChainVariations } from "../actions";
import { useContext } from "react";
import { ChainAnimationContext } from "./steps/chain-step";

export function InstructionsBox() {
  const [wizardState] = useAtom(paceWizardStateAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Use the chain animation context if available
  const chainAnimationContext = useContext(ChainAnimationContext);

  const handleInstructionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    updateField({ instructions: e.target.value });
  };

  const handleRegenerate = async () => {
    if (
      !wizardState.unifiedPrompt.trim() ||
      isRegenerating ||
      !wizardState.instructions.trim()
    )
      return;

    setIsRegenerating(true);
    try {
      // Get the current prompt and instructions
      const currentPrompt = wizardState.unifiedPrompt.trim();
      const instructions = wizardState.instructions.trim();

      // Call the AI server action to enhance the prompt
      const enhanceResult = await enhancePromptStream(
        currentPrompt,
        instructions,
        {
          modelId: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
        }
      );

      // Check if we got a successful response
      if (!enhanceResult.success) {
        throw new Error(enhanceResult.error || "Failed to enhance prompt");
      }

      let enhancedPrompt = "";

      // If we're in streaming mode, we need to handle it differently
      if (enhanceResult.isStreaming) {
        // Set up streaming connection (you'll need to implement this part)
        // This should connect to your streaming endpoint

        // For now, we'll just use a placeholder
        enhancedPrompt = currentPrompt; // Keep the original prompt for now
      } else if (enhanceResult.enhancedPrompt) {
        // For non-streaming mode, we can use the enhanced prompt directly
        enhancedPrompt = enhanceResult.enhancedPrompt;
      }

      // Update the unified prompt
      updateField({ unifiedPrompt: enhancedPrompt });

      // If we're in a specific step, also update that step's field
      if (wizardState.problem === wizardState.unifiedPrompt) {
        updateField({ problem: enhancedPrompt });
      } else if (wizardState.ask === wizardState.unifiedPrompt) {
        updateField({ ask: enhancedPrompt });
      } else if (
        Array.isArray(wizardState.chainVariations) &&
        wizardState.chainVariations.join("\n") === wizardState.unifiedPrompt
      ) {
        // For chain variations, we need to split the enhanced prompt into an array
        const variations = enhancedPrompt.split("\n").filter((v) => v.trim());
        updateField({ chainVariations: variations });

        // Generate chain variations if we're in that step
        try {
          // Call the AI service to generate chain variations based on the enhanced prompt
          const variationsResult =
            await generateChainVariations(enhancedPrompt);

          if (variationsResult.output) {
            // Parse and update the variations
            try {
              const parsedVariations = JSON.parse(variationsResult.output);
              if (
                parsedVariations.chains &&
                Array.isArray(parsedVariations.chains)
              ) {
                updateField({ chainVariations: parsedVariations.chains });
              }
            } catch (parseError) {
              console.error("Error parsing chain variations:", parseError);
            }
          }
        } catch (chainError) {
          console.error("Error generating chain variations:", chainError);
        }
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      // Handle error appropriately
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="instructions">Instructions</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={
            isRegenerating ||
            !wizardState.unifiedPrompt.trim() ||
            !wizardState.instructions.trim()
          }
          className="flex items-center gap-1"
        >
          <Sparkles className="h-4 w-4" />
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
      <Textarea
        id="instructions"
        placeholder="Provide specific instructions to modify the prompt (e.g., 'Change to support 100 concurrent users instead of 10,000')"
        value={wizardState.instructions}
        onChange={handleInstructionsChange}
        className="min-h-[100px]"
      />
      <p className="text-sm text-muted-foreground">
        Add specific instructions for how the AI should modify your prompt.
        Click "Regenerate" to replace the current prompt with an enhanced
        version.
      </p>
    </div>
  );
}
