"use client";

import { RotateCcw, RotateCw, Copy, Download, ArrowLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import InsufficientCreditsAlert from "@/components/prompt-credits/insufficient-credits-alert";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Prompt } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { selectedPromptAtom } from "@/lib/store/prompt-store";
import { enhancePromptStream } from "@/app/(protected)/prompts/prompt/actions";
import { enhancePromptStream as streamPrompt } from "@/app/actions/prompt-stream-action";
import {
  selectedModelAtom,
  temperatureAtom,
  maxLengthAtom,
  topPAtom,
  availableModels,
} from "@/lib/store/ai-settings-store";
import { selectedProductAtom } from "@/lib/store/product-store";
import {
  MODEL_SELECTOR_TYPES,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/hooks/use-toast";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";
import { cn } from "@/lib/utils";

// Import components from the prompts section
// These will be used temporarily until we move them to the ui folder
import { MaxLengthSelector } from "./components/maxlength-selector";
import { ModelSelector } from "./components/model-selector";
import { ProductSelector } from "./components/product-selector";
import { TemperatureSelector } from "./components/temperature-selector";
import { TopPSelector } from "./components/top-p-selector";
import { StreamingSwitch } from "./components/streaming-switch";
import { LoadingOverlay } from "./components/loading-overlay";
import { CompleteIcon, InsertIcon, EditIcon } from "./components/svgIcons";

/**
 * Unified Playground component for both prompts and myprompts sections
 */
export default function Playground({
  prompt,
  title = "Prompt Playground",
}: {
  prompt: Prompt;
  title?: string;
}) {
  // Selection atoms
  const [selectedPrompt, setSelectedPrompt] = useAtom(selectedPromptAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [promptCredits, setPromptCredits] = useAtom(promptCreditsAtom);
  const [hasInsufficientCredits, setHasInsufficientCredits] = useState(false);
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);
  const { toast } = useToast();

  // Store original prompt when the component is first mounted
  const [originalPrompt, setOriginalPrompt] = useState<Prompt | null>(null);

  // Store original prompt body for reset functionality
  const [originalPromptBody, setOriginalPromptBody] = useState(
    selectedPrompt?.body || ""
  );

  // State for enhanced prompts and animations
  const [insertResult, setInsertResult] = useState("");
  const [editResult, setEditResult] = useState("");
  const [activeTab, setActiveTab] = useState<string>("complete");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [instructions, setInstructions] = useState<string>("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Initialize original prompt on component mount
  useEffect(() => {
    // Save the original prompt when the component is first mounted or when prompt id changes
    setOriginalPrompt(selectedPrompt);
    setOriginalPromptBody(selectedPrompt?.body || "");
  }, [selectedPrompt]);

  // Handle the success animation timing
  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessAnimation]);

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
      duration: TOAST_DEFAULT_DURATION,
    });
  }, [selectedPrompt, originalPrompt, setSelectedPrompt, toast]);

  // Handler for copy to clipboard
  const handleCopyToClipboard = useCallback(() => {
    if (!selectedPrompt) return;

    navigator.clipboard.writeText(selectedPrompt.body);
    toast({
      title: "Copied",
      description: "Prompt content copied to clipboard",
      duration: TOAST_DEFAULT_DURATION,
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
    link.download = `${selectedPrompt.title || "prompt"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Prompt content downloaded as text file",
      duration: TOAST_DEFAULT_DURATION,
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
      duration: TOAST_DEFAULT_DURATION,
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
    setShowSuccessAnimation(false); // Reset animation state
    setHasInsufficientCredits(false); // Reset insufficient credits state

    // Auto-switch to the appropriate tab based on the current active tab
    if (activeTab === "complete") {
      setActiveTab("insert");
    }

    // Clear previous results
    setInsertResult("");
    setEditResult("");

    try {
      // Optimistically update credit count if the credits store is available
      if (promptCredits) {
        setPromptCredits({
          ...promptCredits,
          remainingCredits: promptCredits.remainingCredits - 1,
          totalUsedCredits: (promptCredits.totalUsedCredits || 0) + 1,
        });
      }

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

      // Make a copy of the selectedProduct to ensure we're using the current value
      const productToUse = selectedProduct ? { ...selectedProduct } : undefined;

      if (isStreamingEnabled) {
        // For streaming mode, first get a streaming ID from the server action
        try {
          const streamResponse = await enhancePromptStream(
            selectedPrompt.body,
            currentInstructions,
            modelSettings,
            productToUse,
            true // Streaming enabled
          );

          if (streamResponse.success && streamResponse.isStreaming) {
            // Now set up an EventSource to connect to the streaming endpoint
            // Construct the URL with all necessary parameters
            const params = new URLSearchParams({
              promptText: selectedPrompt.body,
              modelId: selectedModel.id,
              temperature: temperature.toString(),
              maxTokens: maxLength.toString(),
              topP: topP.toString(),
            });

            // Add optional parameters if present
            if (currentInstructions) {
              params.append("instructions", currentInstructions);
            }

            // Add contextual info if we have a product
            if (productToUse && typeof productToUse === "object") {
              const contextInfo = `Product: ${productToUse.name || "Unnamed"}\nDescription: ${productToUse.description || "No description"}`;
              params.append("contextualInfo", contextInfo);
            }

            // Use the server action directly instead of making a fetch request
            const stream = await streamPrompt({
              promptText: selectedPrompt.body,
              instructions: currentInstructions,
              modelId: selectedModel.id,
              temperature: temperature,
              maxTokens: maxLength,
              topP: topP,
              contextualInfo:
                productToUse && typeof productToUse === "object"
                  ? `Product: ${productToUse.name || "Unnamed"}\nDescription: ${productToUse.description || "No description"}`
                  : "",
            });

            // Get the reader from the response stream
            const reader = stream.getReader();
            if (!reader) {
              throw new Error("Failed to get stream reader");
            }

            let streamContent = "";
            const decoder = new TextDecoder();

            // Process the stream chunks
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Decode the chunk
              const chunk = decoder.decode(value);

              // Parse SSE format (data: ...\n\n)
              const lines = chunk.split("\n\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    // Extract the JSON string and parse it to get the properly encoded content with newlines
                    const jsonData = line.substring(6);
                    if (jsonData.trim()) {
                      // Parse the JSON data (which preserves newlines)
                      const data = JSON.parse(jsonData);
                      streamContent += data;

                      // Update in real-time
                      if (activeTab === "edit") {
                        setEditResult(streamContent);
                      } else {
                        setInsertResult(streamContent);
                      }
                    }
                  } catch (e) {
                    console.error("Error parsing SSE data:", e);
                  }
                }
              }
            }

            // Show success animation when done
            setShowSuccessAnimation(true);
          } else {
            // Handle server action error
            const errorMessage =
              streamResponse.error || "Failed to initiate streaming";
            setInsertResult("Error: " + errorMessage);
            setEditResult("Error: " + errorMessage);

            // If we need more credits, show alert
            if (streamResponse.needMoreCredits) {
              setHasInsufficientCredits(true);
            }
          }
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          setInsertResult(
            "Error streaming content: " +
              (streamError instanceof Error
                ? streamError.message
                : String(streamError))
          );
          setEditResult(
            "Error streaming content: " +
              (streamError instanceof Error
                ? streamError.message
                : String(streamError))
          );
        }
      } else {
        // For non-streaming mode, wait for the complete response
        const result = await enhancePromptStream(
          selectedPrompt.body,
          currentInstructions,
          modelSettings,
          productToUse,
          false // Streaming disabled
        );

        // Process the result
        if (result.success && result.enhancedPrompt) {
          // Set the enhanced prompt text
          setInsertResult(result.enhancedPrompt);
          setEditResult(result.enhancedPrompt);

          // Show success animation
          setShowSuccessAnimation(true);
        } else {
          // Handle error
          const errorMessage = result.error || "Failed to enhance prompt";
          setInsertResult("Error: " + errorMessage);
          setEditResult("Error: " + errorMessage);

          // If we need more credits, show alert instead of toast
          if (result.needMoreCredits) {
            setHasInsufficientCredits(true);
          }
        }
      }

      // After completion, update credit balance with actual data from server
      try {
        const creditResult = await fetchPromptCredits();
        if (creditResult.success && creditResult.credits) {
          setPromptCredits(creditResult.credits);
        }
      } catch (error) {
        console.error("Failed to update credit balance:", error);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);

      // Check if the error is related to insufficient credits
      const errorStr =
        typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      const errorObj =
        error instanceof Error &&
        error.message &&
        typeof error.message === "string" &&
        error.message.startsWith("{")
          ? JSON.parse(error.message)
          : null;

      if (
        errorStr.toLowerCase().includes("insufficient prompt credits") ||
        errorObj?.error === "Insufficient prompt credits" ||
        errorObj?.needMoreCredits === true
      ) {
        setHasInsufficientCredits(true);
      } else {
        // For other errors, show toast
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
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
    promptCredits,
    setPromptCredits,
    toast,
  ]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const shouldShowButtons = activeTab === "edit" || activeTab === "insert";

  return (
    <div>
      <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold w-48">{title}</h2>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          <ProductSelector />
          <Button variant="outline" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
      {/* Display insufficient credits alert */}
      {hasInsufficientCredits && (
        <div className="my-4">
          <InsufficientCreditsAlert />
        </div>
      )}
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
              <StreamingSwitch
                isEnabled={isStreamingEnabled}
                onToggle={setIsStreamingEnabled}
              />
            </div>
            <div className="md:order-1">
              <TabsContent value="complete" className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">
                  <div data-color-mode="light" className="relative">
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
                      data-testid="original-content"
                    />
                    <LoadingOverlay
                      visible={isEnhancing && !isStreamingEnabled}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                      data-testid="enhance-prompt-button"
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="insert" className="mt-0 border-0 p-0">
                <div className="flex flex-col space-y-4">
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[400px]"
                  >
                    <ResizablePanel defaultSize={50}>
                      <div data-color-mode="light" className="h-full p-2">
                        <div className="border rounded-md overflow-hidden h-full relative">
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
                            height="380px"
                            preview="edit"
                            data-testid="original-content"
                          />
                        </div>
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                      <div data-color-mode="light" className="h-full p-2">
                        <div
                          className={cn(
                            "border rounded-md overflow-hidden h-full relative",
                            showSuccessAnimation && activeTab === "insert"
                              ? "ring-4 ring-emerald-500 ring-offset-4 transition-all duration-300"
                              : ""
                          )}
                        >
                          <MDEditor
                            id="result"
                            value={insertResult}
                            previewOptions={{
                              rehypePlugins: [[rehypeSanitize]],
                            }}
                            height="380px"
                            preview="edit"
                            data-testid="template-content"
                          />
                          <LoadingOverlay
                            visible={
                              isEnhancing &&
                              !isStreamingEnabled &&
                              activeTab === "insert"
                            }
                          />
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                      data-testid="enhance-prompt-button"
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                    {shouldShowButtons && (
                      <>
                        <Button variant="secondary" onClick={handleKeepResult}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Update Original
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
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[400px]"
                  >
                    <ResizablePanel defaultSize={50}>
                      <div className="flex flex-col space-y-4 h-full p-2">
                        <div className="flex flex-1 flex-col space-y-2">
                          <div
                            data-color-mode="light"
                            className="flex-1 border rounded-md overflow-hidden"
                          >
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
                              height="280px"
                              preview="edit"
                              data-testid="original-content"
                            />
                          </div>
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
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                      <div className="h-full p-2">
                        <div
                          data-color-mode="light"
                          className={cn(
                            "h-full border rounded-md overflow-hidden relative",
                            showSuccessAnimation && activeTab === "edit"
                              ? "ring-4 ring-emerald-500 ring-offset-4 transition-all duration-300"
                              : ""
                          )}
                        >
                          <MDEditor
                            id="result"
                            value={editResult}
                            previewOptions={{
                              rehypePlugins: [[rehypeSanitize]],
                            }}
                            height="380px"
                            preview="edit"
                            data-testid="template-content"
                          />
                          <LoadingOverlay
                            visible={
                              isEnhancing &&
                              !isStreamingEnabled &&
                              activeTab === "edit"
                            }
                          />
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                      data-testid="enhance-prompt-button"
                    >
                      {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
                    </Button>
                    {shouldShowButtons && (
                      <>
                        <Button variant="secondary" onClick={handleKeepResult}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Update Original
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
