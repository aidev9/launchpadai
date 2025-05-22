"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";

interface BackendOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function BackendStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.backEndStack &&
      !["Node/NextJS", "Python", "Dotnet", "Ruby on Rails"].includes(
        wizardState.backEndStack
      )
  );

  const backendOptions: BackendOption[] = [
    {
      value: "Node/NextJS",
      label: "Node/NextJS",
      subtitle: "JavaScript runtime environment",
      footer: "Fast & scalable for web applications",
    },
    {
      value: "Python",
      label: "Python",
      subtitle: "Versatile programming language",
      footer: "Great for data science & ML",
    },
    {
      value: "Dotnet",
      label: "Dotnet",
      subtitle: "Microsoft's development platform",
      footer: "Robust for enterprise applications",
    },
    {
      value: "Ruby on Rails",
      label: "Ruby on Rails",
      subtitle: "Full-stack web framework",
      footer: "Fast development with conventions",
    },
  ];

  const handleBackendChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, backEndStack: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, backEndStack: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, backEndStack: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.backEndStack || undefined}
        onValueChange={handleBackendChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {backendOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={!showOther && wizardState.backEndStack === option.value}
            onValueChange={handleBackendChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom backend solution"
          footer="For specific technology stacks"
          checked={showOther === true}
          onValueChange={handleBackendChange}
        />
      </RadioGroup>

      {showOther && (
        <div className="mt-4">
          <Label htmlFor="other-backend">Specify Backend Technology</Label>
          <Textarea
            id="other-backend"
            placeholder="Enter your backend technology"
            value={wizardState.backEndStack}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
