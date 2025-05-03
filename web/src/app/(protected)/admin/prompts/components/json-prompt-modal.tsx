"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { addPromptAction } from "@/lib/firebase/actions/prompts";
import { Prompt } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { initialLoadAtom } from "@/lib/store/prompt-store";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Type for a prompt without id/timestamps
type PromptInput = Omit<Prompt, "id" | "createdAt" | "updatedAt">;

export function JsonPromptModal() {
  const [open, setOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setInitialLoad] = useAtom(initialLoadAtom);

  // Helper function to validate a single prompt object
  const validatePrompt = (prompt: any): PromptInput => {
    if (!prompt.title || !prompt.body) {
      throw new Error("Each prompt must include 'title' and 'body' fields");
    }

    if (!Array.isArray(prompt.phaseTags) || prompt.phaseTags.length === 0) {
      throw new Error("Each prompt must include at least one phaseTag");
    }

    return {
      title: prompt.title,
      body: prompt.body,
      phaseTags: prompt.phaseTags,
      productTags: Array.isArray(prompt.productTags) ? prompt.productTags : [],
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    };
  };

  const handleJsonSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Parse the JSON content
      const parsedData = JSON.parse(jsonContent);

      // Handle both single object and array formats
      const prompts: PromptInput[] = Array.isArray(parsedData)
        ? parsedData.map(validatePrompt)
        : [validatePrompt(parsedData)];

      // Add each prompt to the database
      let successCount = 0;
      let failedCount = 0;

      for (const prompt of prompts) {
        try {
          const result = await addPromptAction(prompt);
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `Successfully added ${successCount} prompt${successCount !== 1 ? "s" : ""}${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
          variant: "default",
        });
        setJsonContent("");
        setOpen(false);
        // Trigger a refresh of the prompts list
        setInitialLoad((prev) => !prev);
      } else {
        setError(`Failed to add any prompts (${failedCount} failed)`);
        toast({
          title: "Error",
          description: `Failed to add any prompts`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid JSON format";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Seed JSON Prompt</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Seed JSON Prompt</DialogTitle>
          <DialogDescription>
            Paste a single JSON object or an array of objects to add multiple
            prompts at once. Each prompt must include title, body, and phaseTags
            fields.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-md bg-black p-6">
            <textarea
              className="bg-black text-muted-foreground border-none resize-y w-full min-h-[200px] font-mono text-sm p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={`// Single prompt:\n{\n  "title": "Your Prompt Title",\n  "body": "Prompt content goes here...",\n  "phaseTags": ["Design", "Development"],\n  "productTags": ["Web Application", "Mobile App"],\n  "tags": ["Architecture", "Best Practices"]\n}\n\n// OR multiple prompts:\n[\n  { "title": "First Prompt", "body": "Content...", "phaseTags": ["Design"] },\n  { "title": "Second Prompt", "body": "Content...", "phaseTags": ["Development"] }\n]`}
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              style={{ outline: "none" }}
              spellCheck="false"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div>
            <p className="text-sm text-muted-foreground">
              Your prompt(s) will be added to the database. You can paste a
              single prompt object or an array of prompts.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJsonSubmit}
              disabled={loading || !jsonContent.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Prompt(s)"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
