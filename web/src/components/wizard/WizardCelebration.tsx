import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, TrophyIcon, StarIcon } from "lucide-react";
import { MiniWizardId } from "@/lib/firebase/schema/enums";

// Themes for different mini-wizards
const celebrationThemes: Record<
  MiniWizardId,
  {
    bgColor: string;
    textColor: string;
    icon: React.ReactNode;
    title: string;
  }
> = {
  [MiniWizardId.CREATE_PRODUCT]: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    icon: <StarIcon className="h-10 w-10 text-blue-500" />,
    title: "Product Created!",
  },
  [MiniWizardId.CREATE_BUSINESS_STACK]: {
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    icon: <StarIcon className="h-10 w-10 text-purple-500" />,
    title: "Business Stack Defined!",
  },
  [MiniWizardId.CREATE_TECHNICAL_STACK]: {
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-800",
    icon: <StarIcon className="h-10 w-10 text-indigo-500" />,
    title: "Technical Stack Completed!",
  },
  [MiniWizardId.CREATE_360_QUESTIONS_STACK]: {
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-800",
    icon: <StarIcon className="h-10 w-10 text-cyan-500" />,
    title: "360 Questions Prepared!",
  },
  [MiniWizardId.CREATE_RULES_STACK]: {
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800",
    icon: <StarIcon className="h-10 w-10 text-emerald-500" />,
    title: "Rules Stack Created!",
  },
  [MiniWizardId.ADD_FEATURES]: {
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    icon: <StarIcon className="h-10 w-10 text-green-500" />,
    title: "Features Added!",
  },
  [MiniWizardId.ADD_COLLECTIONS]: {
    bgColor: "bg-violet-100",
    textColor: "text-violet-800",
    icon: <StarIcon className="h-10 w-10 text-violet-500" />,
    title: "Collections Created!",
  },
  [MiniWizardId.ADD_NOTES]: {
    bgColor: "bg-teal-100",
    textColor: "text-teal-800",
    icon: <StarIcon className="h-10 w-10 text-teal-500" />,
    title: "Notes Added!",
  },
  [MiniWizardId.GENERATE_PROMPT]: {
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    icon: <StarIcon className="h-10 w-10 text-amber-500" />,
    title: "Prompt Generated!",
  },
  [MiniWizardId.GENERATE_ASSET]: {
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    icon: <StarIcon className="h-10 w-10 text-orange-500" />,
    title: "Asset Generated!",
  },
};

type WizardCelebrationProps = {
  miniWizardId?: MiniWizardId;
  xpEarned: number;
  message?: string;
  onContinue?: () => void;
  onComplete?: () => void;
};

export default function WizardCelebration({
  miniWizardId,
  xpEarned,
  message = "Great job! You've completed this step and earned XP!",
  onContinue,
  onComplete,
}: WizardCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const theme = miniWizardId
    ? celebrationThemes[miniWizardId]
    : {
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: <StarIcon className="h-10 w-10 text-blue-500" />,
        title: "Great Progress!",
      };

  // Automatically hide confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      data-testid="wizard-celebration"
      className={`flex items-center justify-center h-full w-full ${theme.bgColor}`}
    >
      {showConfetti && (
        <Confetti recycle={false} numberOfPieces={400} gravity={0.3} />
      )}

      <div className="max-w-2xl w-full mx-auto p-10 rounded-lg bg-white shadow-lg text-center space-y-8">
        <div className="flex justify-center scale-125">{theme.icon}</div>

        <h1
          data-testid="celebration-title"
          className={`text-3xl font-bold ${theme.textColor}`}
        >
          {theme.title}
        </h1>

        <p data-testid="celebration-message" className="text-gray-600 text-lg">
          {message}
        </p>

        <div
          data-testid="celebration-xp-container"
          className="p-5 bg-amber-50 rounded-xl flex items-center justify-center gap-3 shadow-sm"
        >
          <TrophyIcon className="h-6 w-6 text-amber-500" />
          <span
            data-testid="celebration-xp-earned"
            className="text-xl font-bold text-amber-700"
          >
            +{xpEarned} XP
          </span>
        </div>

        <Button
          onClick={onComplete || onContinue}
          className="w-full gap-2 mt-4"
          size="lg"
          data-testid="celebration-continue-button"
        >
          {miniWizardId === MiniWizardId.ADD_NOTES
            ? "Complete Wizard"
            : "Continue to Next Step"}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
