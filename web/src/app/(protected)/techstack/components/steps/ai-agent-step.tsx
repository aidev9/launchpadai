"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CardCheckbox } from "@/app/(protected)/techstack/components/card-checkbox";

interface AIAgentOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function AIAgentStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [otherValue, setOtherValue] = useState("");

  const aiAgentOptions: AIAgentOption[] = [
    {
      value: "LangChain/Graph",
      label: "LangChain/Graph",
      subtitle: "Framework for LLM applications",
      footer: "Composable tools for AI apps",
    },
    {
      value: "Autogen",
      label: "Autogen",
      subtitle: "Multi-agent conversation framework",
      footer: "Build conversational AI systems",
    },
    {
      value: "PydanticAI",
      label: "PydanticAI",
      subtitle: "Type-safe AI interactions",
      footer: "Structured data validation for AI",
    },
  ];

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      // Add the option if it's not already in the array
      if (!wizardState.aiAgentStack.includes(option)) {
        setWizardState({
          ...wizardState,
          aiAgentStack: [...wizardState.aiAgentStack, option],
        });
      }
    } else {
      // Remove the option if it's in the array
      setWizardState({
        ...wizardState,
        aiAgentStack: wizardState.aiAgentStack.filter(
          (item) => item !== option
        ),
      });
    }
  };

  const handleAddOther = () => {
    if (
      otherValue.trim() &&
      !wizardState.aiAgentStack.includes(otherValue.trim())
    ) {
      setWizardState({
        ...wizardState,
        aiAgentStack: [...wizardState.aiAgentStack, otherValue.trim()],
      });
      setOtherValue("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setWizardState({
      ...wizardState,
      aiAgentStack: wizardState.aiAgentStack.filter((item) => item !== option),
    });
  };

  // Filter out standard options to get custom options
  const customOptions = wizardState.aiAgentStack.filter(
    (option) => !aiAgentOptions.map((opt) => opt.value).includes(option)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aiAgentOptions.map((option) => (
          <CardCheckbox
            key={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={wizardState.aiAgentStack.includes(option.value)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked)
            }
          />
        ))}
      </div>

      {/* Other option with text input */}
      <div className="p-0 space-y-0">
        <Label htmlFor="other-ai-agent">Add Other AI Agent Technology</Label>
        <div className="flex space-x-2">
          <Textarea
            id="other-ai-agent"
            placeholder="Enter another AI agent technology"
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
          <Label>Custom AI Agent Technologies</Label>
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
        <Label>Selected AI Agent Technologies</Label>
        {wizardState.aiAgentStack.length === 0 ? (
          <p className="text-muted-foreground mt-2">No technologies selected</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {wizardState.aiAgentStack.map((option) => (
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
