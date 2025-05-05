"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CardRadio } from "@/app/(protected)/techstack/components/card-radio";

interface AppTypeOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function AppTypeStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState<boolean>(
    !!wizardState.appType &&
      !["Full-stack web app", "Mobile app", "AI Agent"].includes(
        wizardState.appType
      )
  );

  const appTypeOptions: AppTypeOption[] = [
    {
      value: "Full-stack web app",
      label: "Full-stack web app",
      subtitle: "Web application with frontend and backend",
      footer: "Best for web platforms and SaaS",
    },
    {
      value: "Mobile app",
      label: "Mobile app",
      subtitle: "Native or cross-platform mobile application",
      footer: "For iOS, Android or both",
    },
    {
      value: "AI Agent",
      label: "AI Agent",
      subtitle: "Autonomous AI application",
      footer: "For automation and smart assistants",
    },
  ];

  const handleAppTypeChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, appType: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, appType: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, appType: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.appType || undefined}
        onValueChange={handleAppTypeChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {appTypeOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={!showOther && wizardState.appType === option.value}
            onValueChange={handleAppTypeChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom application type"
          footer="For specialized use cases"
          checked={showOther === true}
          onValueChange={handleAppTypeChange}
        />
      </RadioGroup>

      {showOther && (
        <div className="mt-4">
          <Label htmlFor="other-app-type">Specify App Type</Label>
          <Textarea
            id="other-app-type"
            placeholder="Enter your app type"
            value={wizardState.appType}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
