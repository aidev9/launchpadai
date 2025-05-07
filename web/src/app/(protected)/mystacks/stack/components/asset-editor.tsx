"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { RefreshCw, Copy, FileDown, Pencil, Trash } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

interface AssetEditorProps {
  selectedAsset: TechStackAsset | null;
  isGeneratingContent: boolean;
  techStack: TechStack | null;
  onGenerateContent: (
    asset: TechStackAsset,
    instructions?: string
  ) => Promise<void>;
  onCopyAsset: (asset: TechStackAsset) => void;
  onDownloadAsset: (asset: TechStackAsset) => void;
  onEditAsset: (asset: TechStackAsset) => void;
  onDeleteAsset: (asset: TechStackAsset) => void;
}

// Function to extract text content from JSON or string
const extractTextContent = (content: string): string => {
  // If content is empty or not a string, return as is
  if (!content || typeof content !== "string") {
    return content || "";
  }

  // Check if content looks like JSON (starts with '{' and contains '"text"')
  const trimmedContent = content.trim();
  if (trimmedContent.startsWith("{") && trimmedContent.includes('"text"')) {
    try {
      const parsed = JSON.parse(trimmedContent);
      if (parsed && parsed.text) {
        return parsed.text;
      }
    } catch (e) {
      console.error("Error parsing JSON content:", e);
      // If JSON parsing fails, continue to return the original content
    }
  }

  // Return the content as is if it's not JSON or doesn't have a text field
  return content;
};

export function AssetEditor({
  selectedAsset,
  isGeneratingContent,
  techStack,
  onGenerateContent,
  onCopyAsset,
  onDownloadAsset,
  onEditAsset,
  onDeleteAsset,
}: AssetEditorProps) {
  const [userInstructions, setUserInstructions] = useState("");

  // Pass the user instructions to the onGenerateContent function
  const handleGenerateContent = () => {
    if (selectedAsset) {
      onGenerateContent(selectedAsset, userInstructions);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {selectedAsset ? selectedAsset.title : "Select an asset"}
        </CardTitle>
        {selectedAsset && (
          <div className="flex flex-wrap gap-1">
            {selectedAsset.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {selectedAsset ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={isGeneratingContent || selectedAsset.isGenerating}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isGeneratingContent || selectedAsset.isGenerating
                      ? "animate-spin"
                      : ""
                  }`}
                />
                {selectedAsset.isGenerating
                  ? "Generating..."
                  : selectedAsset.needsGeneration
                    ? "Generate Content"
                    : "Regenerate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyAsset(selectedAsset)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadAsset(selectedAsset)}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditAsset(selectedAsset)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteAsset(selectedAsset)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {selectedAsset.isGenerating ? (
              <div className="min-h-[400px] border rounded-md p-4 flex flex-col items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-center text-muted-foreground">
                  Generating content for {selectedAsset.title}...
                  <br />
                  <span className="text-sm">This may take a minute</span>
                </p>
              </div>
            ) : (
              <div data-color-mode="light">
                <MDEditor
                  value={extractTextContent(selectedAsset.body)}
                  preview="preview"
                  height={400}
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize]],
                  }}
                />
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                Regeneration Instructions
              </h3>
              <Textarea
                placeholder="Add specific instructions for regenerating this content..."
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                These instructions will be used along with the tech stack
                details when regenerating content.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <p className="text-muted-foreground mb-4">
              Select an asset from the list or create a new one
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
