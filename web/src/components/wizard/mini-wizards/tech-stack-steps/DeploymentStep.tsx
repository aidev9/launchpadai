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

interface DeploymentStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  showOther: { [key: string]: boolean };
  setShowOther: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export default function DeploymentStep({
  wizardState,
  updateField,
  showOther,
  setShowOther,
}: DeploymentStepProps) {
  const deploymentOptions: OptionWithDetails[] = [
    {
      value: "Vercel",
      label: "Vercel",
      subtitle: "Frontend cloud platform",
      footer: "Optimized for Next.js and React",
    },
    {
      value: "Netlify",
      label: "Netlify",
      subtitle: "Web development platform",
      footer: "JAMstack hosting and automation",
    },
    {
      value: "AWS",
      label: "AWS",
      subtitle: "Amazon Web Services",
      footer: "Comprehensive cloud computing",
    },
    {
      value: "Google Cloud",
      label: "Google Cloud",
      subtitle: "Google's cloud platform",
      footer: "AI/ML focused cloud services",
    },
  ];

  const handleDeploymentChange = (value: string) => {
    if (value === "Other") {
      setShowOther((prev) => ({ ...prev, deployment: true }));
      updateField("deploymentStack", "");
    } else {
      setShowOther((prev) => ({ ...prev, deployment: false }));
      updateField("deploymentStack", value);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={
          showOther.deployment
            ? "Other"
            : wizardState.deploymentStack || undefined
        }
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
            checked={
              !showOther.deployment &&
              wizardState.deploymentStack === option.value
            }
            onValueChange={handleDeploymentChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom deployment platform"
          footer="For specialized requirements"
          checked={showOther.deployment === true}
          onValueChange={handleDeploymentChange}
        />
      </RadioGroup>

      {showOther.deployment && (
        <div className="mt-4">
          <Label htmlFor="other-deployment">Specify Deployment Platform</Label>
          <Textarea
            id="other-deployment"
            placeholder="Enter your deployment platform"
            value={wizardState.deploymentStack}
            onChange={(e) => updateField("deploymentStack", e.target.value)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
