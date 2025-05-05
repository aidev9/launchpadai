"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CardRadio } from "@/app/(protected)/techstack/components/card-radio";

interface FrontendOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function FrontEndStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.frontEndStack &&
      !["React/NextJS", "Flask/Django", "Angular", "Vue.js"].includes(
        wizardState.frontEndStack
      )
  );

  const frontendOptions: FrontendOption[] = [
    {
      value: "React/NextJS",
      label: "React/NextJS",
      subtitle: "Modern React framework",
      footer: "Best for dynamic web applications",
    },
    {
      value: "Flask/Django",
      label: "Flask/Django",
      subtitle: "Python-based web frameworks",
      footer: "Great for data-heavy applications",
    },
    {
      value: "Angular",
      label: "Angular",
      subtitle: "TypeScript-based framework",
      footer: "Full-featured for enterprise apps",
    },
    {
      value: "Vue.js",
      label: "Vue.js",
      subtitle: "Progressive JavaScript framework",
      footer: "Balance of simplicity and power",
    },
  ];

  const handleFrontEndChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, frontEndStack: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, frontEndStack: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, frontEndStack: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.frontEndStack || undefined}
        onValueChange={handleFrontEndChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {frontendOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={!showOther && wizardState.frontEndStack === option.value}
            onValueChange={handleFrontEndChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom frontend framework"
          footer="For specialized requirements"
          checked={showOther === true}
          onValueChange={handleFrontEndChange}
        />
      </RadioGroup>

      {showOther && (
        <div className="mt-4">
          <Label htmlFor="other-frontend">Specify Front End Technology</Label>
          <Textarea
            id="other-frontend"
            placeholder="Enter your front end technology"
            value={wizardState.frontEndStack}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
