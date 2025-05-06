"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SuggestionButtonProps {
  suggestion: string;
  onApply: (suggestion: string) => void;
  maxPreviewLength?: number;
}

export function SuggestionButton({
  suggestion,
  onApply,
  maxPreviewLength = 50,
}: SuggestionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure suggestion is a string and truncate for preview
  const suggestionText =
    typeof suggestion === "string" ? suggestion : String(suggestion);

  // Extract the suggestion type/title
  const suggestionTitle = suggestionText.includes(":")
    ? suggestionText.split(":")[0]
    : "";

  // Extract the main recommendation (the part after the title, before any details)
  const mainRecommendation = suggestionText.includes(":")
    ? suggestionText.split(":")[1].split("-")[0].trim()
    : suggestionText;

  // Create a concise tooltip text with just title and main recommendation
  const tooltipText = suggestionTitle
    ? `${suggestionTitle}: ${mainRecommendation}`
    : suggestionText;

  // Truncate suggestion for preview
  const previewText =
    suggestionText.length > maxPreviewLength
      ? `${suggestionText.substring(0, maxPreviewLength)}...`
      : suggestionText;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="text-left h-auto py-3 px-4 w-full justify-start text-sm flex flex-col items-start gap-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onApply(suggestionText)}
          >
            {/* Extract and display the suggestion type as a badge */}
            {suggestionText.includes(":") && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                {suggestionText.split(":")[0]}
              </span>
            )}
            <span className="truncate">{previewText}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-md">
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
