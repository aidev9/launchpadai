import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { TechStack, Phases } from "@/lib/firebase/schema";
import { Product } from "@/lib/firebase/schema";
import { useState, useEffect, useCallback, useRef } from "react";

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
  const [errors, setErrors] = useState({
    name: "",
  });

  // Ref to hold the latest wizardState for stable callbacks
  const wizardStateRef = useRef(wizardState);
  useEffect(() => {
    wizardStateRef.current = wizardState;
  }, [wizardState]);

  // Validate fields on change
  const validateField = useCallback((field: string, value: any) => {
    switch (field) {
      case "name":
        if (!value || value.trim() === "") {
          setErrors((prev) => ({ ...prev, name: "Stack Name is required" }));
          return false;
        } else if (value.length < 3) {
          setErrors((prev) => ({
            ...prev,
            name: "Stack Name must be at least 3 characters",
          }));
          return false;
        } else {
          setErrors((prev) => ({ ...prev, name: "" }));
          return true;
        }
      case "description":
        return true;
      case "phases":
        return true;
      default:
        return true;
    }
  }, []);

  const validateAllFields = useCallback(() => {
    const currentWizardState = wizardStateRef.current;
    const nameIsValid = validateField("name", currentWizardState.name);
    return nameIsValid;
  }, [validateField]);

  // Expose validation function to parent
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).currentAppDetailsStep = {
        validateFields: validateAllFields,
      };
    }
  }, [validateAllFields]);

  const handleFieldUpdate = (field: keyof TechStack, value: any) => {
    updateField(field, value);
    validateField(field, value);
  };

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
          Stack Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="app-name"
          placeholder="Enter your stack name"
          value={wizardState.name}
          onChange={(e) => handleFieldUpdate("name", e.target.value)}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-description">Description</Label>
        <Textarea
          id="app-description"
          placeholder="Enter a description for your application (optional)"
          value={wizardState.description}
          onChange={(e) => handleFieldUpdate("description", e.target.value)}
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
        <Label>Phase(s)</Label>
        <MultiSelect
          options={getPhaseOptions()}
          selected={wizardState.phases}
          onChange={(selected) =>
            handleFieldUpdate(
              "phases",
              selected.map((phase) => phase as Phases)
            )
          }
          placeholder="Select phases... (optional)"
        />
      </div>
    </div>
  );
}
