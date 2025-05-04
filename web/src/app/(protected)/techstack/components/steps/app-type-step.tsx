"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function AppTypeStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.appType &&
      !["Full-stack web app", "Mobile app", "AI Agent"].includes(
        wizardState.appType
      )
  );

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
        className="grid grid-cols-1 gap-4"
      >
        {["Full-stack web app", "Mobile app", "AI Agent"].map((option) => (
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
