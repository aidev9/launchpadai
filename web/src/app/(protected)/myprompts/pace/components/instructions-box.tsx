"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { readStreamableValue } from "ai/rsc";
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
      const { output } = await enhancePromptStream(
        currentPrompt,
        instructions,
        {
          modelId: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
        }
      );

      // Initialize an empty string to collect the streamed response
      let enhancedPrompt = "";

      // Process the streamable value
      for await (const delta of readStreamableValue(output)) {
        enhancedPrompt += delta;
      }

      // Update the unified prompt with the completely replaced enhanced version
      updateField({ unifiedPrompt: enhancedPrompt });

      // If we're in a specific step, also update that step's field
      if (wizardState.problem === wizardState.unifiedPrompt) {
        updateField({ problem: enhancedPrompt });
      } else if (wizardState.ask === wizardState.unifiedPrompt) {
        updateField({ ask: enhancedPrompt });
      } else if (
        wizardState.chainVariations &&
        wizardState.chainVariations.length > 0
      ) {
        // We're in the Chain step, so we need to generate new chain variations
        try {
          // Call the AI service to generate chain variations based on the enhanced prompt
          const result = await generateChainVariations(enhancedPrompt);

          if (result.output) {
            // Process the output
            const outputStr = String(result.output);

            // Split by "Chain 1" and "Chain 2" markers
            const parts = outputStr.split(/Chain \d+:/i);

            // Extract the variations (skip the first empty part)
            const variations = parts
              .slice(1)
              .map((part) => part.trim())
              .filter((part) => part.length > 0);

            // Ensure we have at least one variation
            if (variations.length > 0) {
              // Get Chain 1
              const chain1 = variations[0];

              // Get Chain 2 if available, otherwise use the second variation from the result
              const chain2 = variations.length > 1 ? variations[1] : "";

              // Update chain variations
              updateField({
                chainVariations: [chain1, chain2],
              });

              // Signal to parent component that chain animations should be triggered
              if (chainAnimationContext) {
                chainAnimationContext.setShowChainAnimation(true);
              }
            }
          }
        } catch (error) {
          console.error("Error generating chain variations:", error);
        }
      }
    } catch (error) {
      console.error("Error regenerating prompt:", error);
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
