"use client";

import { RotateCcw, Copy, Download, ArrowLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
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
import { MaxLengthSelector } from "./components/maxlength-selector";
import { ModelSelector } from "./components/model-selector";
import { ProductSelector } from "./components/product-selector";
import { TemperatureSelector } from "./components/temperature-selector";
import { TopPSelector } from "./components/top-p-selector";
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
import { selectedProductAtom } from "@/lib/store/product-store";
import { MODEL_SELECTOR_TYPES } from "@/utils/constants";
import { CompleteIcon, InsertIcon, EditIcon } from "./components/svgIcons";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/hooks/use-toast";

export default function Playground({ prompt }: { prompt: Prompt }) {
  // Selection atoms
  const [selectedPrompt, setSelectedPrompt] = useAtom(selectedPromptAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const { toast } = useToast();

  // Store original prompt when the component is first mounted
  const [originalPrompt, setOriginalPrompt] = useState<Prompt | null>(null);

  // Store original prompt body for reset functionality
  const [originalPromptBody, setOriginalPromptBody] = useState(
    selectedPrompt?.body || ""
  );

  // State for enhanced prompts
  const [insertResult, setInsertResult] = useState("");
  const [editResult, setEditResult] = useState("");
  const [activeTab, setActiveTab] = useState("complete");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [instructions, setInstructions] = useState("");

  // Initialize original prompt on component mount
  useEffect(() => {
    // Save the original prompt when the component is first mounted or when prompt id changes
    setOriginalPrompt(selectedPrompt);
    setOriginalPromptBody(selectedPrompt?.body || "");
    console.log("[useEffect] prompt", prompt);
  }, []);

  // AI Settings atoms
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [temperature, setTemperature] = useAtom(temperatureAtom);
  const [maxLength, setMaxLength] = useAtom(maxLengthAtom);
  const [topP, setTopP] = useAtom(topPAtom);

  // Handle resetting prompt body to original version
  const handleReset = useCallback(() => {
    if (!selectedPrompt || !originalPrompt) return;

    const updatedPrompt = {
      ...selectedPrompt,
      body: originalPrompt.body, // Reset to the original prompt body
    };

    setSelectedPrompt(updatedPrompt);

    toast({
      title: "Reset",
      description: "Prompt has been reset to its original content",
    });
  }, [selectedPrompt, originalPrompt, setSelectedPrompt, toast]);

  // Handler for copy to clipboard
  const handleCopyToClipboard = useCallback(() => {
    if (!selectedPrompt) return;

    navigator.clipboard.writeText(selectedPrompt.body);
    toast({
      title: "Copied",
      description: "Prompt content copied to clipboard",
    });
  }, [selectedPrompt, toast]);

  // Handler for downloading the prompt
  const handleDownload = useCallback(() => {
    if (!selectedPrompt) return;

    const blob = new Blob([selectedPrompt.body], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPrompt.title || "prompt"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Prompt content downloaded as text file",
    });
  }, [selectedPrompt, toast]);

  // Handle keeping enhanced result
  const handleKeepResult = useCallback(() => {
    if (!selectedPrompt) return;

    const resultText = activeTab === "edit" ? editResult : insertResult;
    if (!resultText.trim()) return;

    const updatedPrompt = {
      ...selectedPrompt,
      body: resultText,
    };
    setSelectedPrompt(updatedPrompt);

    toast({
      title: "Updated",
      description: "Prompt updated to enhanced prompt",
    });
  }, [
    selectedPrompt,
    activeTab,
    editResult,
    insertResult,
    setSelectedPrompt,
    toast,
  ]);

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

      // Clear previous results
      setInsertResult("");
      setEditResult("");

      // Make a copy of the selectedProduct to ensure we're using the current value
      const productToUse = selectedProduct ? { ...selectedProduct } : undefined;

      // Call our server action with the prompt text, optional instructions, model settings, and product
      const { output } = await enhancePromptStream(
        selectedPrompt.body,
        currentInstructions,
        modelSettings,
        productToUse
      );

      // Process the streamable value
      for await (const delta of readStreamableValue(output)) {
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
    selectedProduct,
  ]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Remove automatic enhancement when changing tabs
  }, []);

  const shouldShowButtons = activeTab === "edit" || activeTab === "insert";

  return (
    <div>
      <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold w-48">Prompt Playground</h2>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          {/* <PresetSelector presets={presets} /> */}
          <ProductSelector />
          <Button variant="outline" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {/* <PresetSave />
          <div className="hidden space-x-2 md:flex">
            <CodeViewer />
            <PresetShare />
          </div>
          <PresetActions /> */}
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
                  <MDEditor
                    value={prompt.body}
                    previewOptions={{
                      rehypePlugins: [[rehypeSanitize]],
                    }}
                    onChange={(e) => {
                      const updatedPrompt = {
                        ...prompt,
                        body: e || "",
                      };
                      setSelectedPrompt(updatedPrompt);
                    }}
                    height={400}
                    preview="edit"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="insert" className="mt-0 border-0 p-0">
                <div className="flex flex-col space-y-4">
                  <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
                    <MDEditor
                      value={prompt.body}
                      previewOptions={{
                        rehypePlugins: [[rehypeSanitize]],
                      }}
                      onChange={(e) => {
                        const updatedPrompt = {
                          ...prompt,
                          body: e || "",
                        };
                        setSelectedPrompt(updatedPrompt);
                      }}
                      height={400}
                      preview="edit"
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
                    {shouldShowButtons && (
                      <>
                        <Button variant="secondary" onClick={handleKeepResult}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Update
                        </Button>
                        <Button variant="secondary" onClick={handleReset}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit" className="mt-0 border-0 p-0">
                <div className="flex flex-col space-y-4">
                  <div className="grid h-full gap-6 lg:grid-cols-2">
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-1 flex-col space-y-2">
                        <Label htmlFor="input">Prompt</Label>
                        <MDEditor
                          value={prompt.body}
                          previewOptions={{
                            rehypePlugins: [[rehypeSanitize]],
                          }}
                          onChange={(e) => {
                            const updatedPrompt = {
                              ...prompt,
                              body: e || "",
                            };
                            setSelectedPrompt(updatedPrompt);
                          }}
                          height={280}
                          preview="edit"
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
                    {shouldShowButtons && (
                      <>
                        <Button variant="secondary" onClick={handleKeepResult}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Update
                        </Button>
                        <Button variant="secondary" onClick={handleReset}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </>
                    )}
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
