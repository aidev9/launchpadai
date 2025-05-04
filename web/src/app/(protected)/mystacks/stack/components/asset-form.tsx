"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TechStackAsset } from "@/lib/firebase/schema";

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: {
    title: string;
    body: string;
    tags: string[];
    assetType: "PRD" | "Architecture" | "Tasks" | "Rules" | "Prompt" | "Custom";
  }) => Promise<void>;
  asset?: TechStackAsset | null;
}

// Helper function to extract text content from JSON
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

export function AssetForm({ isOpen, onClose, onSave, asset }: AssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: asset?.title || "",
    body: asset?.body ? extractTextContent(asset.body) : "",
    tags: asset?.tags.join(", ") || "",
    assetType: (asset?.assetType || "Custom") as
      | "PRD"
      | "Architecture"
      | "Tasks"
      | "Rules"
      | "Prompt"
      | "Custom",
  });

  // Update form data when asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        title: asset.title || "",
        body: asset.body ? extractTextContent(asset.body) : "",
        tags: asset.tags.join(", ") || "",
        assetType: (asset.assetType || "Custom") as
          | "PRD"
          | "Architecture"
          | "Tasks"
          | "Rules"
          | "Prompt"
          | "Custom",
      });
    }
  }, [asset]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (error) {
      console.error("Error saving asset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Create Asset"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right">
              Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="assetType" className="text-right">
              Asset Type
            </label>
            <select
              id="assetType"
              value={formData.assetType}
              onChange={(e) =>
                handleChange(
                  "assetType",
                  e.target.value as
                    | "PRD"
                    | "Architecture"
                    | "Tasks"
                    | "Rules"
                    | "Prompt"
                    | "Custom"
                )
              }
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PRD">PRD</option>
              <option value="Architecture">Architecture</option>
              <option value="Tasks">Tasks</option>
              <option value="Rules">Rules</option>
              <option value="Prompt">Prompt</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="tags" className="text-right">
              Tags
            </label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="Comma-separated tags"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <label htmlFor="body" className="text-right">
              Content
            </label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleChange("body", e.target.value)}
              className="col-span-3 min-h-[200px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
