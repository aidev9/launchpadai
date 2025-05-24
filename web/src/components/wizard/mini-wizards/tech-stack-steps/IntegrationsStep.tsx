import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TechStack } from "@/lib/firebase/schema";
import { CardCheckbox } from "@/app/(protected)/mystacks/create/components/card-checkbox";

interface OptionWithDetails {
  value: string;
  label: string;
  subtitle: string;
  footer: string;
}

interface IntegrationsStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  otherValues: { [key: string]: string };
  setOtherValues: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export default function IntegrationsStep({
  wizardState,
  updateField,
  otherValues,
  setOtherValues,
}: IntegrationsStepProps) {
  const integrationOptions: OptionWithDetails[] = [
    {
      value: "Stripe",
      label: "Stripe",
      subtitle: "Payment processing platform",
      footer: "Accept payments worldwide",
    },
    {
      value: "Auth0",
      label: "Auth0",
      subtitle: "Identity and access management",
      footer: "Secure authentication service",
    },
    {
      value: "SendGrid",
      label: "SendGrid",
      subtitle: "Email delivery service",
      footer: "Reliable email infrastructure",
    },
    {
      value: "Twilio",
      label: "Twilio",
      subtitle: "Communication APIs",
      footer: "SMS, voice, and video messaging",
    },
  ];

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentIntegrations = wizardState.integrations || [];
    if (checked) {
      if (!currentIntegrations.includes(option)) {
        updateField("integrations", [...currentIntegrations, option]);
      }
    } else {
      updateField(
        "integrations",
        currentIntegrations.filter((integration) => integration !== option)
      );
    }
  };

  const handleAddOther = () => {
    const otherValue = otherValues.integration?.trim();
    if (otherValue && !wizardState.integrations?.includes(otherValue)) {
      updateField("integrations", [
        ...(wizardState.integrations || []),
        otherValue,
      ]);
      setOtherValues((prev) => ({ ...prev, integration: "" }));
    }
  };

  const handleRemoveOption = (option: string) => {
    updateField(
      "integrations",
      wizardState.integrations?.filter((item) => item !== option) || []
    );
  };

  // Filter out standard options to get custom options
  const customOptions = (wizardState.integrations || []).filter(
    (option) => !integrationOptions.map((opt) => opt.value).includes(option)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {integrationOptions.map((option) => (
          <CardCheckbox
            key={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={wizardState.integrations?.includes(option.value) || false}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked)
            }
          />
        ))}
      </div>

      {/* Other option with text input */}
      <div className="p-0 space-y-0">
        <Label htmlFor="other-integration">Add Other Integration</Label>
        <div className="flex space-x-2">
          <Textarea
            id="other-integration"
            placeholder="Enter another integration"
            value={otherValues.integration || ""}
            onChange={(e) =>
              setOtherValues((prev) => ({
                ...prev,
                integration: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOther();
              }
            }}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddOther}>
            Add
          </Button>
        </div>
      </div>

      {/* Display selected custom options with remove button */}
      {customOptions.length > 0 && (
        <div className="mt-4">
          <Label>Custom Integrations</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {customOptions.map((option) => (
              <div
                key={option}
                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1"
              >
                <span>{option}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option)}
                  className="text-secondary-foreground/70 hover:text-secondary-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
