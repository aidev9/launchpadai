"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phases } from "@/lib/firebase/schema";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";

export function BasicInfoStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [name, setName] = useState(wizardState?.name || "");
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState(
    wizardState?.description || ""
  );
  const [selectedPhases, setSelectedPhases] = useState<Phases[]>(
    wizardState?.phases || []
  );
  const [tags, setTags] = useState<string[]>(wizardState?.tags || []);

  // Update the wizard state when form values change
  useEffect(() => {
    if (wizardState) {
      // Only update if values have changed to prevent unnecessary renders
      if (
        wizardState.name !== name ||
        wizardState.description !== description ||
        JSON.stringify(wizardState.phases) !== JSON.stringify(selectedPhases) ||
        JSON.stringify(wizardState.tags) !== JSON.stringify(tags)
      ) {
        setWizardState({
          ...wizardState,
          name,
          description,
          phases: selectedPhases,
          tags,
        });
      }
    }
  }, [name, description, selectedPhases, tags, setWizardState]);

  // Handle phase selection
  const handlePhaseChange = (selected: string[]) => {
    setSelectedPhases(selected as Phases[]);
  };

  // Get all phase values from the enum, excluding 'ALL'
  const phaseOptions = Object.values(Phases).filter(
    (phase) => phase !== Phases.ALL
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Agent Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          data-testid="agent-name-input"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what your agent does"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
          data-testid="agent-description-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Phases</Label>
        <MultiSelect
          options={Object.values(Phases)
            .filter((phase) => phase !== Phases.ALL)
            .map((phase) => ({
              label: phase,
              value: phase,
            }))}
          selected={selectedPhases}
          onChange={handlePhaseChange}
          placeholder="Select phases..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          placeholder="Type and press Enter to add tags"
          data-testid="agent-tags-input"
        />
      </div>
    </div>
  );
}
