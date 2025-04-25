"use client";

// import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { prompts } from "../data/prompts";
import { useAtom } from "jotai";
import { atom } from "jotai";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Create an atom to store the selected prompts
export const selectedPromptsAtom = atom<string[]>([]);

export function PromptsColumn() {
  const [selectedPrompts, setSelectedPrompts] = useAtom(selectedPromptsAtom);

  const handlePromptToggle = (promptId: string) => {
    if (selectedPrompts.includes(promptId)) {
      // Remove prompt if it's already selected
      setSelectedPrompts(selectedPrompts.filter((id) => id !== promptId));
    } else {
      // Add prompt if it's not already selected
      setSelectedPrompts([...selectedPrompts, promptId]);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Guidelines</CardTitle>
        <CardDescription>
          Select guidelines to include in your download
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="flex items-center space-x-2">
              <Checkbox
                id={`prompt-${prompt.id}`}
                checked={selectedPrompts.includes(prompt.id)}
                onCheckedChange={() => handlePromptToggle(prompt.id)}
              />
              <Label
                htmlFor={`prompt-${prompt.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {prompt.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
