"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export function AppDetailsStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [tagInput, setTagInput] = useState("");
  const phases = [
    "Discover",
    "Validate",
    "Design",
    "Build",
    "Secure",
    "Launch",
    "Grow",
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWizardState({ ...wizardState, name: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setWizardState({ ...wizardState, description: e.target.value });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !wizardState.tags.includes(tagInput.trim())) {
      setWizardState({
        ...wizardState,
        tags: [...wizardState.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setWizardState({
      ...wizardState,
      tags: wizardState.tags.filter((t) => t !== tag),
    });
  };

  const handlePhaseChange = (phase: string, checked: boolean) => {
    if (checked) {
      // Add the phase if it's not already in the array
      if (!wizardState.phase.includes(phase)) {
        setWizardState({
          ...wizardState,
          phase: [...wizardState.phase, phase],
        });
      }
    } else {
      // Remove the phase if it's in the array
      setWizardState({
        ...wizardState,
        phase: wizardState.phase.filter((p) => p !== phase),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="app-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="app-name"
          placeholder="Enter your application name"
          value={wizardState.name}
          onChange={handleNameChange}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="app-description">Description</Label>
        <Textarea
          id="app-description"
          placeholder="Enter a description for your application"
          value={wizardState.description}
          onChange={handleDescriptionChange}
          rows={4}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="app-tags">Tags</Label>
        <div className="flex space-x-2">
          <Input
            id="app-tags"
            placeholder="Add tags (e.g., web, mobile, AI)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" onClick={handleAddTag}>
            Add
          </Button>
        </div>

        {/* Display tags */}
        {wizardState.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {wizardState.tags.map((tag) => (
              <div
                key={tag}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-secondary-foreground/70 hover:text-secondary-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase (multi-select) */}
      <div className="space-y-2">
        <Label>
          Phase <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((phase) => (
            <div
              key={phase}
              className="flex items-center space-x-2 border rounded-lg p-4"
            >
              <Checkbox
                id={`phase-${phase}`}
                checked={wizardState.phase.includes(phase)}
                onCheckedChange={(checked) =>
                  handlePhaseChange(phase, checked === true)
                }
              />
              <Label
                htmlFor={`phase-${phase}`}
                className="flex-1 cursor-pointer"
              >
                {phase}
              </Label>
            </div>
          ))}
        </div>

        {/* Display selected phases */}
        {wizardState.phase.length > 0 && (
          <div className="mt-4">
            <Label>Selected Phases</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {wizardState.phase.map((phase) => (
                <div
                  key={phase}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded-full"
                >
                  {phase}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
