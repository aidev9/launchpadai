import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { TechStack, Phases } from "@/lib/firebase/schema";
import { Product } from "@/lib/firebase/schema";

interface AppDetailsStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  product: Product | null;
}

export default function AppDetailsStep({
  wizardState,
  updateField,
  product,
}: AppDetailsStepProps) {
  // Get options for phases
  const getPhaseOptions = () => {
    return Object.values(Phases).map((phase) => ({
      label: phase,
      value: phase,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="app-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="app-name"
          placeholder="Enter your application name"
          value={wizardState.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="app-description"
          placeholder="Enter a description for your application"
          value={wizardState.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Product</Label>
        <Input value={product?.name || "Default Product"} readOnly disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-tags">Tags</Label>
        <TagInput
          value={wizardState.tags}
          onChange={(tags) => updateField("tags", tags)}
          placeholder="Type and press comma or enter to add tags"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Phase(s) <span className="text-red-500">*</span>
        </Label>
        <MultiSelect
          options={getPhaseOptions()}
          selected={wizardState.phases}
          onChange={(selected) =>
            updateField(
              "phases",
              selected.map((phase) => phase as Phases)
            )
          }
          placeholder="Select phases..."
        />
      </div>
    </div>
  );
}
