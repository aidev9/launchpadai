"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PromptStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, prompt: e.target.value });
  };

  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt (Optional)</Label>
        <Textarea
          id="prompt"
          placeholder="Enter a prompt you've already generated for this project"
          value={wizardState.prompt || ""}
          onChange={handlePromptChange}
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          If you already have a prompt for this project, paste it here. This
          will be passed to AI for additional context.
        </p>
      </div>
    </div>
  );
}
