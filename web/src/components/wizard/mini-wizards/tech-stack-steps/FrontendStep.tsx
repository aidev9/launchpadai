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

interface FrontendStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  showOther: { [key: string]: boolean };
  setShowOther: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export default function FrontendStep({
  wizardState,
  updateField,
  showOther,
  setShowOther,
}: FrontendStepProps) {
  const frontendOptions: OptionWithDetails[] = [
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
      setShowOther((prev) => ({ ...prev, frontend: true }));
      updateField("frontEndStack", "");
    } else {
      setShowOther((prev) => ({ ...prev, frontend: false }));
      updateField("frontEndStack", value);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={
          showOther.frontend ? "Other" : wizardState.frontEndStack || undefined
        }
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
            checked={
              !showOther.frontend && wizardState.frontEndStack === option.value
            }
            onValueChange={handleFrontEndChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom frontend framework"
          footer="For specialized requirements"
          checked={showOther.frontend === true}
          onValueChange={handleFrontEndChange}
        />
      </RadioGroup>

      {showOther.frontend && (
        <div className="mt-4">
          <Label htmlFor="other-frontend">Specify Front End Technology</Label>
          <Textarea
            id="other-frontend"
            placeholder="Enter your front end technology"
            value={wizardState.frontEndStack}
            onChange={(e) => updateField("frontEndStack", e.target.value)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
