"use client";

import { useAtom } from "jotai";
import {
  selectedTechStackAtom,
  techStackWizardStateAtom,
} from "@/lib/store/techstack-store";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { Phases } from "@/lib/firebase/schema";

export function AppDetailsStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );

  // Use useEffect to update the state when the component mounts or when selectedProduct changes
  useEffect(() => {
    // Get product ID from selected product or use a default value
    const productId = selectedProduct?.id || "default";

    console.log("Setting productId in AppDetailsStep:", {
      selectedProduct: selectedProduct,
      selectedTechStack: selectedTechStack,
      productId,
    });

    // Always update the productId in the wizard state
    setWizardState((prevState) => ({
      ...prevState,
      productId,
      id: selectedTechStack?.id || "",
    }));
  }, [selectedProduct, setWizardState, selectedTechStack]);

  const getPhaseOptions = () => {
    const options = Object.values(Phases).map((option) => ({
      label: option,
      value: option,
    }));
    return options;
  };

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
      phases: selected.map((phase) => phase as Phases),
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

      {/* Product (read-only display) */}
      <div className="space-y-2">
        <Label>Product</Label>
        <Input
          value={selectedProduct?.name || "Default Product"}
          readOnly
          disabled
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
          options={getPhaseOptions()}
          selected={wizardState.phases}
          onChange={handlePhaseChange}
          placeholder="Select phases..."
        />
      </div>
    </div>
  );
}
