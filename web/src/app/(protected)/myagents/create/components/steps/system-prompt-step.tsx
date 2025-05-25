"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Loader2, Undo2 } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebasePrompts } from "@/lib/firebase/client/FirebasePrompts";
import { Prompt } from "@/lib/firebase/schema";
import {
  EnhancedSelect,
  EnhancedSelectItem,
} from "@/components/ui/enhanced-select";
import MDEditor from "@uiw/react-md-editor";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { enhancePromptStream as streamPrompt } from "@/app/actions/prompt-stream-action";

export function SystemPromptStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [systemPrompt, setSystemPrompt] = useState(
    wizardState?.systemPrompt || ""
  );
  const [previousSystemPrompt, setPreviousSystemPrompt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedMyPrompt, setSelectedMyPrompt] =
    useState<EnhancedSelectItem | null>(null);
  const [selectedAllPrompt, setSelectedAllPrompt] =
    useState<EnhancedSelectItem | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  // Fetch user prompts
  const [myPrompts, myPromptsLoading, myPromptsError] = useCollectionData(
    firebasePrompts.getUserPrompts()
  );

  // Fetch all prompts
  const [allPrompts, allPromptsLoading, allPromptsError] = useCollectionData(
    firebasePrompts.getAllPrompts()
  );

  // Convert prompts to enhanced select items
  const myPromptsData: EnhancedSelectItem[] = (
    (myPrompts as Prompt[]) || []
  ).map((prompt) => ({
    id: prompt.id || "",
    title: prompt.title,
    description:
      prompt.body.length > 200
        ? prompt.body.substring(0, 200) + "..."
        : prompt.body,
    tags: [...(prompt.phaseTags || []), ...(prompt.tags || [])],
  }));

  const allPromptsData: EnhancedSelectItem[] = (
    (allPrompts as Prompt[]) || []
  ).map((prompt) => ({
    id: prompt.id || "",
    title: prompt.title,
    description:
      prompt.body.length > 200
        ? prompt.body.substring(0, 200) + "..."
        : prompt.body,
    tags: [...(prompt.phaseTags || []), ...(prompt.tags || [])],
  }));

  // Update wizard state when system prompt changes
  useEffect(() => {
    if (wizardState) {
      setWizardState({
        ...wizardState,
        systemPrompt,
      });
    }
  }, [systemPrompt, setWizardState]);

  // Handle prompt selection from My Prompts
  const handleMyPromptSelect = (item: EnhancedSelectItem) => {
    const selectedPrompt = myPrompts?.find(
      (p: any) => p.id === item.id
    ) as Prompt;
    if (selectedPrompt) {
      setSystemPrompt(selectedPrompt.body);
      setSelectedMyPrompt(item);
      setSelectedAllPrompt(null); // Clear the other selection
    }
  };

  // Handle prompt selection from All Prompts
  const handleAllPromptSelect = (item: EnhancedSelectItem) => {
    const selectedPrompt = allPrompts?.find(
      (p: any) => p.id === item.id
    ) as Prompt;
    if (selectedPrompt) {
      setSystemPrompt(selectedPrompt.body);
      setSelectedAllPrompt(item);
      setSelectedMyPrompt(null); // Clear the other selection
    }
  };

  // Handle AI enhancement with streaming
  const handleEnhance = async () => {
    if (!systemPrompt.trim()) {
      toast({
        title: "No Prompt to Enhance",
        description: "Please enter a system prompt before enhancing.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    if (!instructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide instructions for enhancing the prompt.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    // Save the current prompt as previous version
    setPreviousSystemPrompt(systemPrompt);
    setIsEnhancing(true);
    setIsStreaming(true);

    try {
      // Store the original prompt before clearing
      const originalPrompt = systemPrompt;

      // Clear the current content
      setSystemPrompt("");

      // Use the streaming action to get a ReadableStream
      const stream = await streamPrompt({
        promptText: originalPrompt,
        instructions: instructions,
        modelId: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        contextualInfo: "",
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

                // Update the MDEditor in real-time
                setSystemPrompt(streamContent);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      setInstructions(""); // Clear instructions after successful enhancement
      toast({
        title: "Prompt Enhanced",
        description: "Your system prompt has been successfully enhanced.",
        duration: TOAST_DEFAULT_DURATION,
      });
    } catch (error) {
      console.error("Enhancement error:", error);
      // Restore the previous prompt on error
      setSystemPrompt(previousSystemPrompt);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance the prompt. Please try again.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsEnhancing(false);
      setIsStreaming(false);
    }
  };

  // Handle undo functionality
  const handleUndo = () => {
    if (previousSystemPrompt) {
      setSystemPrompt(previousSystemPrompt);
      setPreviousSystemPrompt(""); // Clear the previous version after undo
      toast({
        title: "Changes Undone",
        description: "Restored the previous version of your system prompt.",
        duration: TOAST_DEFAULT_DURATION,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* <div className="space-y-2">
        <h3 className="text-lg font-medium">System Prompt</h3>
        <p className="text-sm text-muted-foreground">
          Select a prompt from your collection or all prompts, then customize it
          for your agent.
        </p>
      </div> */}

      {/* Enhanced Select Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="my-prompts">My Prompts</Label>
          <EnhancedSelect
            data={myPromptsData}
            onSelect={handleMyPromptSelect}
            placeholder="Select from your prompts..."
            selectedItem={selectedMyPrompt}
            data-testid="my-prompts-select"
          />
          {myPromptsLoading && (
            <p className="text-xs text-muted-foreground">
              Loading your prompts...
            </p>
          )}
          {myPromptsError && (
            <p className="text-xs text-destructive">
              Error loading your prompts
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="all-prompts">All Prompts</Label>
          <EnhancedSelect
            data={allPromptsData}
            onSelect={handleAllPromptSelect}
            placeholder="Select from all prompts..."
            selectedItem={selectedAllPrompt}
            data-testid="all-prompts-select"
          />
          {allPromptsLoading && (
            <p className="text-xs text-muted-foreground">
              Loading all prompts...
            </p>
          )}
          {allPromptsError && (
            <p className="text-xs text-destructive">
              Error loading all prompts
            </p>
          )}
        </div>
      </div>

      {/* MDEditor for System Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="system-prompt-editor">System Prompt Content</Label>
          {isStreaming && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Streaming content...
            </div>
          )}
        </div>
        <Card>
          <CardContent className="p-4">
            <MDEditor
              value={systemPrompt}
              onChange={(value) => !isStreaming && setSystemPrompt(value || "")} // Disable editing during streaming
              preview="edit"
              hideToolbar={false}
              visibleDragbar={false}
              data-color-mode="light"
              height={300}
              data-testid="system-prompt-editor"
            />
          </CardContent>
        </Card>
      </div>

      {/* Instructions and Enhance */}
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions for Enhancement</Label>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Textarea
              id="instructions"
              placeholder="Provide instructions on how you'd like to enhance or modify the prompt..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              data-testid="enhancement-instructions"
            />
          </div>
          <div className="flex-shrink-0 flex flex-col gap-2">
            <Button
              onClick={handleEnhance}
              disabled={
                isEnhancing || !instructions.trim() || !systemPrompt.trim()
              }
              data-testid="enhance-button"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isStreaming ? "Streaming..." : "Enhancing..."}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Enhance
                </>
              )}
            </Button>
            {previousSystemPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={isEnhancing}
                data-testid="undo-button"
              >
                <Undo2 className="mr-2 h-3 w-3" />
                Undo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
