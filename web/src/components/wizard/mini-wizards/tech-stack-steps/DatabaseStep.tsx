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

interface DatabaseStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  showOther: { [key: string]: boolean };
  setShowOther: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export default function DatabaseStep({
  wizardState,
  updateField,
  showOther,
  setShowOther,
}: DatabaseStepProps) {
  const databaseOptions: OptionWithDetails[] = [
    {
      value: "PostgreSQL",
      label: "PostgreSQL",
      subtitle: "Advanced open-source relational database",
      footer: "ACID compliant with JSON support",
    },
    {
      value: "MySQL",
      label: "MySQL",
      subtitle: "Popular open-source relational database",
      footer: "Fast and reliable for web applications",
    },
    {
      value: "MongoDB",
      label: "MongoDB",
      subtitle: "Document-oriented NoSQL database",
      footer: "Flexible schema for modern apps",
    },
    {
      value: "Firebase",
      label: "Firebase",
      subtitle: "Google's mobile/web app platform",
      footer: "Real-time database with hosting",
    },
  ];

  const handleDatabaseChange = (value: string) => {
    if (value === "Other") {
      setShowOther((prev) => ({ ...prev, database: true }));
      updateField("databaseStack", "");
    } else {
      setShowOther((prev) => ({ ...prev, database: false }));
      updateField("databaseStack", value);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={
          showOther.database ? "Other" : wizardState.databaseStack || undefined
        }
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
            checked={
              !showOther.database && wizardState.databaseStack === option.value
            }
            onValueChange={handleDatabaseChange}
          />
        ))}
        <CardRadio
          value="Other"
          id="Other"
          label="Other"
          subtitle="Custom database solution"
          footer="For specialized requirements"
          checked={showOther.database === true}
          onValueChange={handleDatabaseChange}
        />
      </RadioGroup>

      {showOther.database && (
        <div className="mt-4">
          <Label htmlFor="other-database">Specify Database Technology</Label>
          <Textarea
            id="other-database"
            placeholder="Enter your database technology"
            value={wizardState.databaseStack}
            onChange={(e) => updateField("databaseStack", e.target.value)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
