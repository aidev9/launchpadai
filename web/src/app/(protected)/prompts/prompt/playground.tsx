"use client";

import { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";
import { readStreamableValue } from "ai/rsc";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from "./components/code-viewer";
import { MaxLengthSelector } from "./components/maxlength-selector";
import { ModelSelector } from "./components/model-selector";
import { PresetActions } from "./components/preset-actions";
import { PresetSave } from "./components/preset-save";
import { PresetSelector } from "./components/preset-selector";
import { PresetShare } from "./components/preset-share";
import { TemperatureSelector } from "./components/temperature-selector";
import { TopPSelector } from "./components/top-p-selector";
import { presets } from "./data/presets";
import { Prompt } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { selectedPromptAtom } from "@/lib/store/prompt-store";
import { enhancePromptStream } from "./actions";
import {
  selectedModelAtom,
  temperatureAtom,
  maxLengthAtom,
  topPAtom,
  availableModels,
} from "@/lib/store/ai-settings-store";
import { MODEL_SELECTOR_TYPES } from "@/utils/constants";
import { CompleteIcon, InsertIcon, EditIcon } from "./components/svgIcons";

export const metadata: Metadata = {
  title: "Playground",
  description: "The OpenAI Playground built using the components.",
};

export default function Playground({ prompt }: { prompt: Prompt }) {
  // Selection atoms
  const [selectedPrompt, setSelectedPrompt] = useAtom(selectedPromptAtom);

  // State for enhanced prompts
  const [insertResult, setInsertResult] = useState("");
  const [editResult, setEditResult] = useState("");
  const [activeTab, setActiveTab] = useState("complete");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [instructions, setInstructions] = useState("");

  // AI Settings atoms
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [temperature, setTemperature] = useAtom(temperatureAtom);
  const [maxLength, setMaxLength] = useAtom(maxLengthAtom);
  const [topP, setTopP] = useAtom(topPAtom);

  // Handle model selection change
  const handleModelChange = useCallback(
    (value: string) => {
      const model = availableModels.find((m) => m.id === value);
      if (model) {
        setSelectedModel(model);
      }
    },
    [setSelectedModel]
  );

  // Handle enhance prompt action using React Server Action
  const handleEnhancePrompt = useCallback(async () => {
    if (isEnhancing || !selectedPrompt?.body) return;

    setIsEnhancing(true);

    // Auto-switch to the appropriate tab based on the current active tab
    if (activeTab === "complete") {
      setActiveTab("insert");
    }

    try {
      // Get instructions if we're in the edit tab
      const currentInstructions =
        activeTab === "edit" ? instructions : undefined;

      // Prepare model settings
      const modelSettings = {
        modelId: selectedModel.id,
        temperature: temperature,
        maxTokens: maxLength,
        topP: topP,
      };

      // Call our server action with the prompt text, optional instructions, and model settings
      const { output } = await enhancePromptStream(
        selectedPrompt.body,
        currentInstructions,
        modelSettings
      );

      // Reset the result for a fresh start
      setInsertResult("");
      setEditResult("");

      // Process the streamable value
      for await (const delta of readStreamableValue(output)) {
        // Update both result fields as we receive streaming content
        setInsertResult((current) => current + delta);
        setEditResult((current) => current + delta);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
    } finally {
      setIsEnhancing(false);
    }
  }, [
    selectedPrompt?.body,
    isEnhancing,
    activeTab,
    instructions,
    selectedModel,
    temperature,
    maxLength,
    topP,
  ]);

  // Handle tab change
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // If changing to insert or edit tab, automatically trigger enhancement if no results yet
      if (value === "insert" && !insertResult) {
        handleEnhancePrompt();
      } else if (value === "edit" && !editResult) {
        handleEnhancePrompt();
      }
    },
    [insertResult, editResult, handleEnhancePrompt]
  );

  return (
    <div>
      <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold w-48">Prompt Playground</h2>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          <PresetSelector presets={presets} />
          <PresetSave />
          <div className="hidden space-x-2 md:flex">
            <CodeViewer />
            <PresetShare />
          </div>
          <PresetActions />
        </div>
      </div>
      <Separator />
      <Tabs
        defaultValue="complete"
        className="flex-1"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="h-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
              <div className="grid gap-2">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Mode
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-[320px] text-sm" side="left">
                    Choose the interface that best suits your task. You can
                    provide: a simple prompt to complete, starting and ending
                    text to insert a completion within, or some text with
                    instructions to edit it.
                  </HoverCardContent>
                </HoverCard>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="complete">
                    <span className="sr-only">Complete</span>
                    <CompleteIcon />
                  </TabsTrigger>
                  <TabsTrigger value="insert">
                    <span className="sr-only">Insert</span>
                    <InsertIcon />
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    <span className="sr-only">Edit</span>
                    <EditIcon />
                  </TabsTrigger>
                </TabsList>
              </div>
              <ModelSelector
                types={MODEL_SELECTOR_TYPES}
                models={availableModels}
                defaultValue={selectedModel.id}
                onValueChange={handleModelChange}
              />
              <TemperatureSelector
                defaultValue={[temperature]}
                onValueChange={(values) => values && setTemperature(values[0])}
              />
              <MaxLengthSelector
                defaultValue={[maxLength]}
                onValueChange={(values) => values && setMaxLength(values[0])}
              />
              <TopPSelector
                defaultValue={[topP]}
                onValueChange={(values) => values && setTopP(values[0])}
              />
            </div>
            <div className="md:order-1">
              <TabsContent value="complete" className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">
                  <Textarea
                    placeholder="Prompt body"
                    value={prompt.body}
                    onChange={(e) => {
                      const updatedPrompt = {
                        ...prompt,
                        body: e.target.value,
                      };
                      setSelectedPrompt(updatedPrompt);
                    }}
                    className="min-h-[400px] flex-1 p-4 md:min-h-[400px] lg:min-h-[400px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                    <Button variant="secondary">
                      <span className="sr-only">Show history</span>
                      <RotateCcw />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="insert" className="mt-0 border-0 p-0">
                <div className="flex flex-col space-y-4">
                  <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                    <Textarea
                      placeholder="Prompt body"
                      value={prompt.body}
                      onChange={(e) => {
                        const updatedPrompt = {
                          ...prompt,
                          body: e.target.value,
                        };
                        setSelectedPrompt(updatedPrompt);
                      }}
                      className="h-full min-h-[300px] lg:min-h-[400px] xl:min-h-[400px]"
                    />
                    <div className="rounded-md bg-muted">
                      <Textarea
                        id="result"
                        placeholder="Results"
                        className="h-full"
                        value={insertResult}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                    <Button variant="secondary">
                      <span className="sr-only">Show history</span>
                      <RotateCcw />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit" className="mt-0 border-0 p-0">
                <div className="flex flex-col space-y-4">
                  <div className="grid h-full gap-6 lg:grid-cols-2">
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-1 flex-col space-y-2">
                        <Label htmlFor="input">Prompt</Label>
                        <Textarea
                          id="input"
                          placeholder="Prompt body"
                          value={prompt.body}
                          onChange={(e) => {
                            const updatedPrompt = {
                              ...prompt,
                              body: e.target.value,
                            };
                            setSelectedPrompt(updatedPrompt);
                          }}
                          className="flex-1 lg:min-h-[280px] resize-y"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Improve the prompt by adding more details"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-[21px] min-h-[380px] rounded-md border-0 bg-muted lg:min-h-[380px]">
                      <Textarea
                        id="result"
                        placeholder="Results"
                        className="h-full"
                        value={editResult}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                    <Button variant="secondary">
                      <span className="sr-only">Show history</span>
                      <RotateCcw />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
