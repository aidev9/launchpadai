"use client";

import React, { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface AnimatedMDEditorProps {
  value: string;
  onChange: (value?: string) => void;
  onBlur?: () => void;
  height?: number;
  preview?: "edit" | "preview" | "live";
  showAnimation?: boolean;
  hideToolbar?: boolean;
  className?: string;
}

export function AnimatedMDEditor({
  value,
  onChange,
  onBlur,
  height = 300,
  preview = "edit",
  showAnimation = false,
  hideToolbar = false,
  className,
}: AnimatedMDEditorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevShowAnimation, setPrevShowAnimation] = useState(false);

  // Trigger animation when showAnimation prop changes to true
  useEffect(() => {
    // Only trigger animation if showAnimation changes from false to true
    if (showAnimation && !prevShowAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    // Update previous value
    setPrevShowAnimation(showAnimation);
  }, [showAnimation, prevShowAnimation]);

  return (
    <div
      className={cn(
        "transition-all duration-1200 rounded-sm",
        isAnimating ? "ring-6 ring-emerald-600" : "ring-0",
        className
      )}
      data-color-mode="light"
    >
      <MDEditor
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        height={height}
        preview={preview}
        hideToolbar={hideToolbar}
      />
    </div>
  );
}
