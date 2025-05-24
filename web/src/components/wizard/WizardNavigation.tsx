import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import { useAtom } from "jotai";
import { completedMiniWizardsAtom } from "@/lib/atoms/wizard";

interface WizardNavigationProps {
  className?: string;
}

export default function WizardNavigation({ className }: WizardNavigationProps) {
  const router = useRouter();
  const [completedMiniWizards] = useAtom(completedMiniWizardsAtom);

  // Check if all mini-wizards are completed
  const allCompleted = [
    MiniWizardId.CREATE_PRODUCT,
    MiniWizardId.CREATE_BUSINESS_STACK,
    MiniWizardId.CREATE_TECHNICAL_STACK,
    MiniWizardId.CREATE_360_QUESTIONS_STACK,
    MiniWizardId.CREATE_RULES_STACK,
    MiniWizardId.ADD_FEATURES,
    MiniWizardId.ADD_NOTES,
  ].every((wizardId) => completedMiniWizards.includes(wizardId));

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <Button
        variant="default"
        onClick={() => router.push("/wizard")}
        className="w-full"
      >
        Continue Product Wizard
      </Button>

      {allCompleted && (
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="w-full"
        >
          Go to Dashboard
        </Button>
      )}
    </div>
  );
}
