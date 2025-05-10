"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { featureWizardStateAtom } from "@/lib/store/feature-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DetailsStep() {
  // Use the atom directly to avoid sync issues
  const [wizardState, setWizardState] = useAtom(featureWizardStateAtom);

  // Use the handleChange functions to update the atom directly
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWizardState((prev) => ({ ...prev, name: value }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setWizardState((prev) => ({ ...prev, description: value }));
  };

  const handleStatusChange = (value: string) => {
    setWizardState((prev) => ({ ...prev, status: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setWizardState((prev) => ({ ...prev, tags }));
  };

  // Status options
  const statusOptions = [
    { label: "Draft", value: "Draft" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
    { label: "Under Development", value: "Under Development" },
  ];

  // Track if component has mounted
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after initial render
  useEffect(() => {
    setIsMounted(true);
    // No dependencies - runs only once after mount
  }, []);

  // No need for useEffect to update the atom on unmount
  // since we're updating it directly with the handlers

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="feature-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="feature-name"
          placeholder="Enter feature name"
          value={wizardState.name}
          onChange={handleNameChange}
        />
        <p className="text-sm text-muted-foreground">
          Give your feature a clear, descriptive name.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="feature-description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="feature-description"
          placeholder="Enter a detailed description of the feature"
          value={wizardState.description}
          onChange={handleDescriptionChange}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Describe what this feature does and why it's valuable. (Max 500
          characters)
        </p>
      </div>

      {/* Status - Using buttons instead of Select component */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={
                wizardState.status === option.value ? "default" : "outline"
              }
              onClick={() => handleStatusChange(option.value)}
              className="transition-all"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Indicate the current status of this feature.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="feature-tags">Tags</Label>
        <TagInput
          placeholder="Type and press enter to add tags"
          value={wizardState.tags}
          onChange={handleTagsChange}
        />
        {/* <p className="text-sm text-muted-foreground">
          Add tags to categorize your feature (e.g., "UI", "Backend",
          "Performance").
        </p> */}
      </div>
    </div>
  );
}
