"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function DeploymentStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.deploymentStack &&
      !["Vercel", "AWS", "Azure", "GCP", "Digital Ocean"].includes(
        wizardState.deploymentStack
      )
  );

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
        className="grid grid-cols-1 gap-4"
      >
        {["Vercel", "AWS", "Azure", "GCP", "Digital Ocean"].map((option) => (
          <div
            key={option}
            className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
          >
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
          <RadioGroupItem value="Other" id="Other" />
          <Label htmlFor="Other" className="flex-1 cursor-pointer">
            Other
          </Label>
        </div>
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
