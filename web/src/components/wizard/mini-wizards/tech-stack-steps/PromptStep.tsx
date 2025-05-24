import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechStack } from "@/lib/firebase/schema";

interface PromptStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
}

export default function PromptStep({
  wizardState,
  updateField,
}: PromptStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tech-prompt">Project Prompt (Optional)</Label>
        <Textarea
          id="tech-prompt"
          placeholder="Add a prompt you've already generated for this project..."
          value={wizardState.prompt || ""}
          onChange={(e) => updateField("prompt", e.target.value)}
          rows={6}
        />
        <p className="text-sm text-muted-foreground">
          This can be helpful context for generating assets later.
        </p>
      </div>
    </div>
  );
}
