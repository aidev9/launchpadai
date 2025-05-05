"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press comma to add...",
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check if the input ends with a comma
    if (newValue.endsWith(",")) {
      // Get the value without the comma
      const tagValue = newValue.slice(0, -1).trim();

      // Add the tag if it's not empty and not already in the list
      if (tagValue && !value.includes(tagValue)) {
        onChange([...value, tagValue]);
      }

      // Clear the input
      setInputValue("");
    } else {
      setInputValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter key
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();

      const tagValue = inputValue.trim();
      if (!value.includes(tagValue)) {
        onChange([...value, tagValue]);
      }

      setInputValue("");
    }

    // Remove the last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {/* Tags displayed above the input */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className="rounded hover:bg-secondary"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input field below the tags */}
      <div
        onClick={handleFocus}
        className={`flex items-center p-2 border rounded-md ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
        }`}
      >
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="ring-0 border-0 shadow-none p-1 focus-visible:ring-0 focus-visible:border-0 focus-visible:shadow-none h-5 w-full"
        />
      </div>
    </div>
  );
}
