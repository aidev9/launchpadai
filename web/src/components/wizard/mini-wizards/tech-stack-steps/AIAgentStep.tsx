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

interface AIAgentStepProps {
  wizardState: TechStack;
  updateField: (field: keyof TechStack, value: any) => void;
  otherValues: { [key: string]: string };
  setOtherValues: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export default function AIAgentStep({
  wizardState,
  updateField,
  otherValues,
  setOtherValues,
}: AIAgentStepProps) {
  const aiAgentOptions: OptionWithDetails[] = [
    {
      value: "LangChain/Graph",
      label: "LangChain/Graph",
      subtitle: "Framework for LLM applications",
      footer: "Composable tools for AI apps",
    },
    {
      value: "Autogen",
      label: "Autogen",
      subtitle: "Multi-agent conversation framework",
      footer: "Build conversational AI systems",
    },
    {
      value: "PydanticAI",
      label: "PydanticAI",
      subtitle: "Type-safe AI interactions",
      footer: "Structured data validation for AI",
    },
    {
      value: "OpenAI GPT",
      label: "OpenAI GPT",
      subtitle: "OpenAI's language models",
      footer: "Powerful text generation and chat",
    },
  ];

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentAgents = wizardState.aiAgentStack || [];
    if (checked) {
      if (!currentAgents.includes(option)) {
        updateField("aiAgentStack", [...currentAgents, option]);
      }
    } else {
      updateField(
        "aiAgentStack",
        currentAgents.filter((agent) => agent !== option)
      );
    }
  };

  const handleAddOther = () => {
    const otherValue = otherValues.aiAgent?.trim();
    if (otherValue && !wizardState.aiAgentStack?.includes(otherValue)) {
      updateField("aiAgentStack", [
        ...(wizardState.aiAgentStack || []),
        otherValue,
      ]);
      setOtherValues((prev) => ({ ...prev, aiAgent: "" }));
    }
  };

  const handleRemoveOption = (option: string) => {
    updateField(
      "aiAgentStack",
      wizardState.aiAgentStack?.filter((item) => item !== option) || []
    );
  };

  // Filter out standard options to get custom options
  const customOptions = (wizardState.aiAgentStack || []).filter(
    (option) => !aiAgentOptions.map((opt) => opt.value).includes(option)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aiAgentOptions.map((option) => (
          <CardCheckbox
            key={option.value}
            id={option.value}
            label={option.label}
            subtitle={option.subtitle}
            footer={option.footer}
            checked={wizardState.aiAgentStack?.includes(option.value) || false}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked)
            }
          />
        ))}
      </div>

      {/* Other option with text input */}
      <div className="p-0 space-y-0">
        <Label htmlFor="other-ai-agent">Add Other AI Agent Technology</Label>
        <div className="flex space-x-2">
          <Textarea
            id="other-ai-agent"
            placeholder="Enter another AI agent technology"
            value={otherValues.aiAgent || ""}
            onChange={(e) =>
              setOtherValues((prev) => ({ ...prev, aiAgent: e.target.value }))
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
          <Label>Custom AI Agent Technologies</Label>
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
