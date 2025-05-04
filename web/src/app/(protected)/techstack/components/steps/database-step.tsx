"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function DatabaseStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.database &&
      !["Relational", "NoSQL", "Hybrid"].includes(wizardState.database)
  );

  const handleDatabaseChange = (value: string) => {
    if (value === "Other") {
      setShowOther(true);
      setWizardState({ ...wizardState, database: "" });
    } else {
      setShowOther(false);
      setWizardState({ ...wizardState, database: value });
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWizardState({ ...wizardState, database: e.target.value });
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther ? "Other" : wizardState.database || undefined}
        onValueChange={handleDatabaseChange}
        className="grid grid-cols-1 gap-4"
      >
        {["Relational", "NoSQL", "Hybrid"].map((option) => (
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
          <Label htmlFor="other-database">Specify Database Type</Label>
          <Textarea
            id="other-database"
            placeholder="Enter your database type"
            value={wizardState.database}
            onChange={handleOtherChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
