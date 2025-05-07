"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProblemSuggestion } from "@/lib/store/pace-store";

interface SuggestionButtonProps {
  suggestion: ProblemSuggestion;
  onApply: (suggestion: ProblemSuggestion) => void;
  maxPreviewLength?: number;
}

export function SuggestionButton({
  suggestion,
  onApply,
  maxPreviewLength = 50,
}: SuggestionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the label and body from the suggestion
  const { label, body } = suggestion;

  // Truncate body for preview
  const previewText =
    body.length > maxPreviewLength
      ? `${body.substring(0, maxPreviewLength)}...`
      : body;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="text-left h-auto py-3 px-4 w-full justify-start text-sm flex flex-col items-start gap-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onApply(suggestion)}
          >
            {/* Display the label as a badge */}
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
              {label}
            </span>
            <span className="truncate">{previewText}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-md">
          <p className="text-sm">{body}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
