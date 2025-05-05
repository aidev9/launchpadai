"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";

export function AppDetailsStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);

  // Phase options for MultiSelect
  const phaseOptions: MultiSelectOption[] = [
    { label: "Discover", value: "Discover" },
    { label: "Validate", value: "Validate" },
    { label: "Design", value: "Design" },
    { label: "Build", value: "Build" },
    { label: "Secure", value: "Secure" },
    { label: "Launch", value: "Launch" },
    { label: "Grow", value: "Grow" },
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWizardState({ ...wizardState, name: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setWizardState({ ...wizardState, description: e.target.value });
  };

  // Handle phase selection change
  const handlePhaseChange = (selected: string[]) => {
    setWizardState({
      ...wizardState,
      phase: selected,
    });
  };

  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    setWizardState({
      ...wizardState,
      tags,
    });
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
        <Label htmlFor="app-description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="app-description"
          placeholder="Enter a description for your application"
          value={wizardState.description}
          onChange={handleDescriptionChange}
          rows={4}
        />
      </div>

      {/* Tags using TagInput component */}
      <div className="space-y-2">
        <Label htmlFor="app-tags">Tags</Label>
        <TagInput
          value={wizardState.tags}
          onChange={handleTagsChange}
          placeholder="Type and press comma or enter to add tags"
        />
      </div>

      {/* Phase using MultiSelect component */}
      <div className="space-y-2">
        <Label>
          Phase <span className="text-red-500">*</span>
        </Label>
        <MultiSelect
          options={phaseOptions}
          selected={wizardState.phase}
          onChange={handlePhaseChange}
          placeholder="Select phases..."
        />
      </div>
    </div>
  );
}
