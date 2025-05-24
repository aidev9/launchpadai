import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup } from "@/components/ui/radio-group";
import { TechStack } from "@/lib/firebase/schema";
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";

interface OptionWithDetails {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

interface BackendStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  showOther: { [key: string]: boolean };
  setShowOther: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export default function BackendStep({
  wizardState,
  updateField,
  showOther,
  setShowOther,
}: BackendStepProps) {
  const backendOptions: OptionWithDetails[] = [
    {
      value: "Node.js",
      label: "Node.js",
      subtitle: "JavaScript runtime environment",
      footer: "Fast and scalable server applications",
    },
    {
      value: "Python",
      label: "Python",
      subtitle: "Versatile programming language",
      footer: "Great for AI/ML and web development",
    },
    {
      value: ".NET",
      label: ".NET",
      subtitle: "Microsoft's development platform",
      footer: "Enterprise-grade applications",
    },
    {
      value: "Java",
      label: "Java",
      subtitle: "Object-oriented programming language",
      footer: "Robust and platform-independent",
    },
  ];

  const handleBackendChange = (value: string) => {
    if (value === "Other") {
      setShowOther((prev) => ({ ...prev, backend: true }));
      updateField("backEndStack", "");
    } else {
      setShowOther((prev) => ({ ...prev, backend: false }));
      updateField("backEndStack", value);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={
          showOther.backend ? "Other" : wizardState.backEndStack || undefined
        }
        onValueChange={handleBackendChange}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {backendOptions.map((option) => (
          <CardRadio
            key={option.value}
            value={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={
              !showOther.backend && wizardState.backEndStack === option.value
            }
            onValueChange={handleBackendChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom backend technology"
          footer="For specialized requirements"
          checked={showOther.backend === true}
          onValueChange={handleBackendChange}
        />
      </RadioGroup>

      {showOther.backend && (
        <div className="mt-4">
          <Label htmlFor="other-backend">Specify Backend Technology</Label>
          <Textarea
            id="other-backend"
            placeholder="Enter your backend technology"
            value={wizardState.backEndStack}
            onChange={(e) => updateField("backEndStack", e.target.value)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
