"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function IntegrationsStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [otherValue, setOtherValue] = useState("");
  const options = ["Payments", "Email", "APIs"];

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      // Add the option if it's not already in the array
      if (!wizardState.integrations.includes(option)) {
        setWizardState({
          ...wizardState,
          integrations: [...wizardState.integrations, option],
        });
      }
    } else {
      // Remove the option if it's in the array
      setWizardState({
        ...wizardState,
        integrations: wizardState.integrations.filter(
          (item) => item !== option
        ),
      });
    }
  };

  const handleAddOther = () => {
    if (
      otherValue.trim() &&
      !wizardState.integrations.includes(otherValue.trim())
    ) {
      setWizardState({
        ...wizardState,
        integrations: [...wizardState.integrations, otherValue.trim()],
      });
      setOtherValue("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setWizardState({
      ...wizardState,
      integrations: wizardState.integrations.filter((item) => item !== option),
    });
  };

  // Filter out standard options to get custom options
  const customOptions = wizardState.integrations.filter(
    (option) => !options.includes(option)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {options.map((option) => (
          <div
            key={option}
            className="flex items-center space-x-2 border rounded-lg p-4"
          >
            <Checkbox
              id={option}
              checked={wizardState.integrations.includes(option)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(option, checked === true)
              }
            />
            <Label htmlFor={option} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </div>

      {/* Other option with text input */}
      <div className="border rounded-lg p-4 space-y-4">
        <Label htmlFor="other-integration">Add Other Integration</Label>
        <div className="flex space-x-2">
          <Textarea
            id="other-integration"
            placeholder="Enter another integration"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddOther}>
            Add
          </Button>
        </div>
      </div>

      {/* Display selected custom options with remove button */}
      {customOptions.length > 0 && (
        <div className="mt-4">
          <Label>Custom Integrations</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {customOptions.map((option) => (
              <div
                key={option}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1"
              >
                <span>{option}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option)}
                  className="text-secondary-foreground/70 hover:text-secondary-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display selected options */}
      <div className="mt-4">
        <Label>Selected Integrations</Label>
        {wizardState.integrations.length === 0 ? (
          <p className="text-muted-foreground mt-2">No integrations selected</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {wizardState.integrations.map((option) => (
              <div
                key={option}
                className="bg-primary text-primary-foreground px-3 py-1 rounded-full"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
