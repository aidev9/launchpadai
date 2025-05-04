"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function BackendStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.backendStack &&
      !["Node/NextJS", "Python", "Dotnet", "Ruby on Rails"].includes(
        wizardState.backendStack
      )
  );

  const handleBackendChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, backendStack: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, backendStack: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, backendStack: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.backendStack || undefined}
        onValueChange={handleBackendChange}
        className="grid grid-cols-1 gap-4"
      >
        {["Node/NextJS", "Python", "Dotnet", "Ruby on Rails"].map((option) => (
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
          <Label htmlFor="other-backend">Specify Backend Technology</Label>
          <Textarea
            id="other-backend"
            placeholder="Enter your backend technology"
            value={wizardState.backendStack}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
