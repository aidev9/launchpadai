"use client";

import React, { useState, useEffect } from "react";
// Chain Outputs step - This step allows users to create a sequence of prompts
// where each prompt builds on the output of the previous one
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  paceWizardStateAtom,
  updatePaceFieldAtom,
} from "@/lib/store/pace-store";
import { InstructionsBox } from "../instructions-box";
import { generateChainVariations } from "../../actions";
import { AnimatedMDEditor } from "../animated-md-editor";
import { createContext, useContext } from "react";

// Create a context for chain animations
export const ChainAnimationContext = createContext({
  showChainAnimation: false,
  setShowChainAnimation: (value: boolean) => {},
});

export function ChainStep() {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showChain1Animation, setShowChain1Animation] = useState(false);
  const [showChain2Animation, setShowChain2Animation] = useState(false);
  const [showChainAnimation, setShowChainAnimation] = useState(false);

  // Reset animation flags after animation completes
  useEffect(() => {
    if (showChain1Animation) {
      const timer = setTimeout(() => {
        setShowChain1Animation(false);
      }, 5500); // Slightly longer than the animation duration
      return () => clearTimeout(timer);
    }
  }, [showChain1Animation]);

  useEffect(() => {
    if (showChain2Animation) {
      const timer = setTimeout(() => {
        setShowChain2Animation(false);
      }, 5500); // Slightly longer than the animation duration
      return () => clearTimeout(timer);
    }
  }, [showChain2Animation]);

  // Watch for chain animation triggers from the InstructionsBox
  useEffect(() => {
    if (showChainAnimation) {
      // Trigger animations for both chains
      setShowChain1Animation(true);
      setShowChain2Animation(true);
      // Reset the trigger
      setShowChainAnimation(false);
    }
  }, [showChainAnimation]);

  // Initialize chain variations if empty or if ask has changed
  useEffect(() => {
    // If chain variations are empty, initialize them
    if (wizardState.chainVariations.length === 0) {
      updateField({ chainVariations: ["", ""] });
    }

    // If ask is not empty and chain variations are empty strings, pre-populate with ask
    if (
      wizardState.ask.trim() &&
      wizardState.chainVariations.every((v) => !v.trim())
    ) {
      updateField({
        chainVariations: [
          `# Next Prompt in Sequence\n\nBased on the output from the initial prompt "${wizardState.ask.substring(0, 50)}${wizardState.ask.length > 50 ? "..." : ""}"\n\nAnalyze the results and provide a detailed breakdown of the key components.`,
          `# Final Prompt in Sequence\n\nUsing the analysis from Chain 1, synthesize the findings into actionable recommendations.`,
        ],
      });
      // Trigger animations
      setShowChain1Animation(true);
      setShowChain2Animation(true);
    }
  }, [wizardState.chainVariations, wizardState.ask, updateField]);

  // Generate chain sequence
  const handleGenerateChainVariations = async () => {
    // Use unifiedPrompt if available, otherwise use ask
    const initialPrompt =
      wizardState.unifiedPrompt.trim() || wizardState.ask.trim();
    if (!initialPrompt || isLoading) return;

    setIsLoading(true);
    try {
      // Step 1: Generate Chain 1 based on the initial prompt
      const result1 = await generateChainVariations(initialPrompt);

      if (result1.output) {
        // Process the output directly
        const outputStr1 = String(result1.output);

        // Split by "Chain 1" and "Chain 2" markers
        const parts1 = outputStr1.split(/Chain \d+:/i);

        // Extract the variations (skip the first empty part)
        const variations1 = parts1
          .slice(1)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        // Ensure we have at least one variation
        if (variations1.length > 0) {
          // Get Chain 1
          const chain1 = variations1[0];

          // Update the first chain variation immediately
          updateField({
            chainVariations: [chain1, wizardState.chainVariations[1] || ""],
          });

          // Trigger animation for Chain 1
          setShowChain1Animation(true);

          // Step 2: Generate Chain 2 based on Chain 1
          const result2 = await generateChainVariations(chain1);

          if (result2.output) {
            // Process the output directly
            const outputStr2 = String(result2.output);

            // Split by "Chain 1" and "Chain 2" markers
            const parts2 = outputStr2.split(/Chain \d+:/i);

            // Extract the variations (skip the first empty part)
            const variations2 = parts2
              .slice(1)
              .map((part) => part.trim())
              .filter((part) => part.length > 0);

            // Ensure we have at least one variation
            if (variations2.length > 0) {
              // Get Chain 2 from the result
              const chain2 = variations2[0];

              // Update both chain variations
              updateField({
                chainVariations: [chain1, chain2],
              });

              // Trigger animations for both chains
              setShowChain1Animation(true);
              setShowChain2Animation(true);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating chain variations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific chain variation
  const updateChainVariation = (index: number, value: string) => {
    const newVariations = [...wizardState.chainVariations];
    newVariations[index] = value;
    updateField({ chainVariations: newVariations });
  };

  return (
    <div className="space-y-6">
      {/* Current prompt */}

      <div data-color-mode="light">
        <MDEditor
          value={wizardState.unifiedPrompt || wizardState.ask}
          preview="preview"
          hideToolbar={true}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
          height={250}
        />
      </div>

      <Button
        onClick={handleGenerateChainVariations}
        disabled={
          isLoading ||
          !(wizardState.unifiedPrompt.trim() || wizardState.ask.trim())
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Chain Sequence
          </>
        )}
      </Button>

      {/* Chain variations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chain 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Chain 1</CardTitle>
            <CardDescription>The next prompt in your sequence</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedMDEditor
              value={wizardState.chainVariations[0] || ""}
              onChange={(value) => updateChainVariation(0, value || "")}
              height={300}
              preview="edit"
              showAnimation={showChain1Animation}
            />
          </CardContent>
        </Card>

        {/* Chain 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Chain 2</CardTitle>
            <CardDescription>The final prompt in your sequence</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatedMDEditor
              value={wizardState.chainVariations[1] || ""}
              onChange={(value) => updateChainVariation(1, value || "")}
              height={300}
              preview="edit"
              showAnimation={showChain2Animation}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <div className="bg-muted p-4 rounded-md">
        <h4 className="font-medium">Tips for effective prompt chaining:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
          <li>Design each prompt to build on the output of the previous one</li>
          <li>
            Make Chain 1 focus on analyzing or processing the initial output
          </li>
          <li>
            Make Chain 2 focus on synthesizing or applying the analysis from
            Chain 1
          </li>
          <li>
            Include clear instructions on how each prompt connects to the
            previous one
          </li>
          <li>
            Consider the entire sequence as a multi-step reasoning process
          </li>
        </ul>
      </div>

      {/* Instructions Box */}
      <ChainAnimationContext.Provider
        value={{ showChainAnimation, setShowChainAnimation }}
      >
        <InstructionsBox />
      </ChainAnimationContext.Provider>
    </div>
  );
}
