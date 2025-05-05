"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CardRadio } from "@/app/(protected)/techstack/components/card-radio";

interface DeploymentOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function DeploymentStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.deploymentStack &&
      !["Vercel", "AWS", "Azure", "GCP", "Digital Ocean"].includes(
        wizardState.deploymentStack
      )
  );

  const deploymentOptions: DeploymentOption[] = [
    {
      value: "Vercel",
      label: "Vercel",
      subtitle: "Deploy web projects seamlessly",
      footer: "Best for Next.js and frontend apps",
    },
    {
      value: "AWS",
      label: "AWS",
      subtitle: "Amazon Web Services",
      footer: "Comprehensive cloud platform",
    },
    {
      value: "Azure",
      label: "Azure",
      subtitle: "Microsoft's cloud platform",
      footer: "Great for enterprise integrations",
    },
    {
      value: "GCP",
      label: "GCP",
      subtitle: "Google Cloud Platform",
      footer: "Advanced AI & data capabilities",
    },
    {
      value: "Digital Ocean",
      label: "Digital Ocean",
      subtitle: "Simple cloud infrastructure",
      footer: "Developer-friendly experience",
    },
  ];

  const handleDeploymentChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, deploymentStack: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, deploymentStack: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, deploymentStack: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.deploymentStack || undefined}
        onValueChange={handleDeploymentChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {deploymentOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={!showOther && wizardState.deploymentStack === option.value}
            onValueChange={handleDeploymentChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom deployment solution"
          footer="For specialized hosting needs"
          checked={showOther === true}
          onValueChange={handleDeploymentChange}
        />
      </RadioGroup>

      {showOther && (
        <div className="mt-4">
          <Label htmlFor="other-deployment">Specify Deployment Platform</Label>
          <Textarea
            id="other-deployment"
            placeholder="Enter your deployment platform"
            value={wizardState.deploymentStack}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
