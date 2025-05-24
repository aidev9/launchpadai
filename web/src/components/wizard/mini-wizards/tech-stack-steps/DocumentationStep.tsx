import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { TechStack } from "@/lib/firebase/schema";

interface DocumentationStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
}

export default function DocumentationStep({
  wizardState,
  updateField,
}: DocumentationStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="doc-links">Documentation Links (Optional)</Label>
        <TagInput
          value={wizardState.documentationLinks}
          onChange={(links) => updateField("documentationLinks", links)}
          placeholder="Enter URLs and press comma or enter to add..."
        />
        <p className="text-sm text-muted-foreground">
          Add links to documentation, repositories, or resources for your
          project.
        </p>
      </div>
    </div>
  );
}
