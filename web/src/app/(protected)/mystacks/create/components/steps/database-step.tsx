"use client";

import { useAtom } from "jotai";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";

interface DatabaseOption {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

export function DatabaseStep() {
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [showOther, setShowOther] = useState(
    wizardState.database &&
      !["Relational", "NoSQL", "Hybrid"].includes(wizardState.database)
  );

  const databaseOptions: DatabaseOption[] = [
    {
      value: "Relational",
      label: "Relational",
      subtitle: "SQL-based structured data",
      footer: "Best for structured complex data",
    },
    {
      value: "NoSQL",
      label: "NoSQL",
      subtitle: "Non-relational databases",
      footer: "Great for flexible schemas",
    },
    {
      value: "Hybrid",
      label: "Hybrid",
      subtitle: "Mixed database approach",
      footer: "Best of both relational & NoSQL",
    },
  ];

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
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {databaseOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={!showOther && wizardState.database === option.value}
            onValueChange={handleDatabaseChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom database solution"
          footer="For specialized data requirements"
          checked={showOther === true}
          onValueChange={handleDatabaseChange}
        />
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
