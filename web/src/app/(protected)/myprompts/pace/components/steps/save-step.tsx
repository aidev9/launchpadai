"use client";

import React from "react";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { phaseOptions } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  paceWizardStateAtom,
  updatePaceFieldAtom,
} from "@/lib/store/pace-store";
import { InstructionsBox } from "../instructions-box";

interface SaveStepProps {
  onSubmit: () => void;
}

export function SaveStep({ onSubmit }: SaveStepProps) {
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [, updateField] = useAtom(updatePaceFieldAtom);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField({ title: e.target.value });
  };

  // Handle phase selection change
  const handlePhaseChange = (selected: string[]) => {
    updateField({ phase: selected });
  };

  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    updateField({ tags: tags });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="prompt-title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="prompt-title"
          placeholder="Enter a title for your prompt"
          className="w-120"
          value={wizardState.title}
          onChange={handleTitleChange}
        />
        {/* <p className="text-sm text-muted-foreground">
              Choose a descriptive title that helps you identify this prompt
            </p> */}
      </div>

      {/* Phase */}
      <div className="space-y-2">
        <Label>
          Phase <span className="text-red-500">*</span>
        </Label>
        <MultiSelect
          options={phaseOptions}
          selected={wizardState.phase}
          onChange={handlePhaseChange}
          className="w-120"
          placeholder="Select phases..."
        />
        {/* <p className="text-sm text-muted-foreground">
              Select the phases this prompt is relevant for
            </p> */}
      </div>

      {/* Tags */}
      <div className="space-y-2 w-120">
        <Label htmlFor="prompt-tags">Tags</Label>
        <TagInput
          value={wizardState.tags}
          onChange={handleTagsChange}
          placeholder="Type and press comma or enter to add tags"
        />
        {/* <p className="text-sm text-muted-foreground">
              Add tags to help categorize and find your prompt
            </p> */}
      </div>
      {/* <CardFooter className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={!wizardState.title || wizardState.phase.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Save Prompt
          </Button>
        </CardFooter> */}

      {/* Preview */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Prompt Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
            <div className="font-medium mb-2">
              Title: {wizardState.title || "[No title]"}
            </div>
            <div className="mb-2">
              <span className="font-medium">Phases: </span>
              {wizardState.phase.length > 0
                ? wizardState.phase.join(", ")
                : "[No phases selected]"}
            </div>
            <div className="mb-4">
              <span className="font-medium">Tags: </span>
              {wizardState.tags.length > 0
                ? wizardState.tags.join(", ")
                : "[No tags]"}
            </div>
            <div className="border-t pt-4 mt-2">
              <div className="font-medium mb-2">Prompt Content:</div>
              <div className="text-sm">
                {wizardState.finalPrompt
                  ? wizardState.finalPrompt.substring(0, 200) +
                    (wizardState.finalPrompt.length > 200 ? "..." : "")
                  : "[No content]"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Instructions Box */}
      {/* <InstructionsBox /> */}
    </div>
  );
}
