"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CardCheckbox } from "@/app/(protected)/mystacks/create/components/card-checkbox";

interface IntegrationOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function IntegrationsStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [otherValue, setOtherValue] = useState("");

  const integrationOptions: IntegrationOption[] = [
    {
      value: "Payments",
      label: "Payments",
      subtitle: "Payment processing integration",
      footer: "Stripe, PayPal, or custom solutions",
    },
    {
      value: "Email",
      label: "Email",
      subtitle: "Email delivery services",
      footer: "Transactional and marketing emails",
    },
    {
      value: "APIs",
      label: "APIs",
      subtitle: "Third-party API integrations",
      footer: "Connect with external services",
    },
  ];

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
    (option) => !integrationOptions.map((opt) => opt.value).includes(option)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {integrationOptions.map((option) => (
          <CardCheckbox
            key={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={wizardState.integrations.includes(option.value)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked)
            }
          />
        ))}
      </div>

      {/* Other option with text input */}
      <div className="p-0 space-y-0">
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
