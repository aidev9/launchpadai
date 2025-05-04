"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function FrontEndStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.frontEndStack &&
      !["React/NextJS", "Flask/Django", "Angular", "Vue.js"].includes(
        wizardState.frontEndStack
      )
  );

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
        className="grid grid-cols-1 gap-4"
      >
        {["React/NextJS", "Flask/Django", "Angular", "Vue.js"].map((option) => (
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
