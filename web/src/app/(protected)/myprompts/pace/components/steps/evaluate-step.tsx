"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructionsBox } from "../instructions-box";
import { AnimatedMDEditor } from "../animated-md-editor";
import { testPrompt } from "../../actions";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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

export function EvaluateStep() {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [showEditorAnimation, setShowEditorAnimation] = useState(false);
  const [isTestingPrompt, setIsTestingPrompt] = useState<boolean>(false);

  // Reset animation flag after animation completes
  useEffect(() => {
    if (showEditorAnimation) {
      const timer = setTimeout(() => {
        setShowEditorAnimation(false);
      }, 5500); // Slightly longer than the animation duration
      return () => clearTimeout(timer);
    }
  }, [showEditorAnimation]);

  // Generate the final prompt when the component mounts or when relevant state changes
  useEffect(() => {
    // Use the unified prompt if available, otherwise combine the problem, ask, and chain variations
    const generateFinalPrompt = () => {
      // If we have a unified prompt, use it directly
      if (wizardState.unifiedPrompt.trim()) {
        return wizardState.unifiedPrompt;
      }

      // Otherwise, build the prompt from individual components
      let prompt = "";

      // Add the problem section if it exists
      if (wizardState.problem.trim()) {
        prompt += `# Problem\n${wizardState.problem}\n\n`;
      }

      // Add the ask section if it exists
      if (wizardState.ask.trim()) {
        prompt += `# Ask\n${wizardState.ask}\n\n`;
      }

      // Add the chain variations if they exist
      const chainVariations = wizardState.chainVariations.filter((v) =>
        v.trim()
      );
      if (chainVariations.length > 0) {
        prompt += `# Chain\n`;
        chainVariations.forEach((variation, index) => {
          prompt += `## Chain Variation ${index + 1}\n${variation}\n\n`;
        });
      }

      // Add a footer
      prompt += `---\n*This prompt was created using the PACE framework.*`;

      return prompt;
    };

    const newFinalPrompt = generateFinalPrompt();
    setFinalPrompt(newFinalPrompt);
    updateField({ finalPrompt: newFinalPrompt });
  }, [
    wizardState.problem,
    wizardState.ask,
    wizardState.chainVariations,
    updateField,
  ]);

  // Handle changes to the final prompt
  const handleFinalPromptChange = (value: string | undefined) => {
    const newValue = value || "";
    setFinalPrompt(newValue);
    updateField({ finalPrompt: newValue });
  };

  // Handle testing the prompt
  const handleTestPrompt = async () => {
    if (!finalPrompt.trim() || isTestingPrompt) return;

    setIsTestingPrompt(true);
    setAiResponse("Generating response...");

    try {
      // Call the AI service using the testPrompt server action
      // Pass "evaluate" as the suggestion type to indicate this is a direct evaluation
      const result = await testPrompt(finalPrompt, "evaluate");

      if (result.error) {
        setAiResponse(`Error: ${result.error}`);
      } else if (result.output) {
        setAiResponse(String(result.output));
        // Trigger animation when response is received
        setShowEditorAnimation(true);
      } else {
        setAiResponse("No response received from the AI model.");
      }
    } catch (error) {
      console.error("Error testing prompt:", error);
      setAiResponse("Error generating response. Please try again.");
    } finally {
      setIsTestingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <AnimatedMDEditor
            value={finalPrompt}
            onChange={handleFinalPromptChange}
            height={400}
            preview="edit"
            showAnimation={showEditorAnimation}
          />
        </TabsContent>

        <TabsContent value="preview">
          <AnimatedMDEditor
            value={finalPrompt}
            onChange={(value) => {}}
            preview="preview"
            hideToolbar={true}
            height={400}
            showAnimation={showEditorAnimation}
          />
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <div className="space-y-4">
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[400px] rounded-lg border"
            >
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="p-2 border-b">
                    <Label htmlFor="playground-prompt">Prompt</Label>
                  </div>
                  <div className="flex-1 p-2">
                    <AnimatedMDEditor
                      value={finalPrompt}
                      onChange={handleFinalPromptChange}
                      height={350}
                      preview="edit"
                      showAnimation={showEditorAnimation}
                      className="h-full"
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="p-2 border-b">
                    <Label htmlFor="playground-response">AI Response</Label>
                  </div>
                  <div className="flex-1 p-2">
                    <AnimatedMDEditor
                      value={aiResponse}
                      onChange={() => {}}
                      height={350}
                      preview="preview"
                      hideToolbar={true}
                      className="h-full"
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            <div className="flex justify-end">
              <Button
                onClick={handleTestPrompt}
                disabled={isTestingPrompt || !finalPrompt.trim()}
              >
                {isTestingPrompt ? "Generating..." : "Test Prompt"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Instructions Box */}
      <InstructionsBox />

      {/* Tips */}
      <div className="bg-muted p-4 rounded-md">
        <h4 className="font-medium">Evaluation Tips:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
          <li>Review your prompt for clarity and specificity</li>
          <li>Ensure all necessary context is included</li>
          <li>Check for ambiguity or vague language</li>
          <li>Consider if the prompt will produce the desired output format</li>
          <li>Make final adjustments before saving</li>
        </ul>
      </div>
    </div>
  );
}
