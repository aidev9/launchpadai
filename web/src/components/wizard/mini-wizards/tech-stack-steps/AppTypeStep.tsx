import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup } from "@/components/ui/radio-group";
import { TechStack } from "@/lib/firebase/schema";
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";
import { useState } from "react";

interface OptionWithDetails {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

interface AppTypeStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  showOther: { [key: string]: boolean };
  setShowOther: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export default function AppTypeStep({
  wizardState,
  updateField,
  showOther,
  setShowOther,
}: AppTypeStepProps) {
  const [errors, setErrors] = useState({ appType: "" });

  const appTypeOptions: OptionWithDetails[] = [
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
    {
      value: "API/Service",
      label: "API/Service",
      subtitle: "Backend service or API",
      footer: "For microservices and integrations",
    },
  ];

  const validateAppType = (value: string) => {
    if (showOther.appType && (!value || value.trim() === "")) {
      setErrors({ appType: "Please specify your app type" });
    } else {
      setErrors({ appType: "" });
    }
  };

  const handleAppTypeChange = (value: string) => {
    if (value === "Other") {
      setShowOther((prev) => ({ ...prev, appType: true }));
      updateField("appType", "");
      validateAppType("");
    } else {
      setShowOther((prev) => ({ ...prev, appType: false }));
      updateField("appType", value);
      setErrors({ appType: "" });
    }
  };

  const handleOtherAppTypeChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    updateField("appType", value);
    validateAppType(value);
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={showOther.appType ? "Other" : wizardState.appType || undefined}
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
            checked={!showOther.appType && wizardState.appType === option.value}
            onValueChange={handleAppTypeChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom application type"
          footer="For specialized use cases"
          checked={showOther.appType === true}
          onValueChange={handleAppTypeChange}
        />
      </RadioGroup>

      {showOther.appType && (
        <div className="mt-4">
          <Label htmlFor="other-app-type">Specify App Type</Label>
          <Textarea
            id="other-app-type"
            placeholder="Enter your app type"
            value={wizardState.appType}
            onChange={handleOtherAppTypeChange}
            className={`mt-1 ${errors.appType ? "border-red-500" : ""}`}
          />
          {errors.appType && (
            <p className="text-sm text-red-500 mt-1">{errors.appType}</p>
          )}
        </div>
      )}
    </div>
  );
}
