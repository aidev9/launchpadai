import React from "react";
import { CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StarIcon, TrophyIcon } from "lucide-react";

type WizardHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  xpEarned: number;
  encouragementMessage: string;
};

export default function WizardHeader({
  title,
  currentStep,
  totalSteps,
  percentComplete,
  xpEarned,
  encouragementMessage,
}: WizardHeaderProps) {
  return (
    <CardHeader className="pb-1 py-6 px-8 space-y-1">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge
          variant="outline"
          className="px-2 py-0.5 bg-amber-100 text-amber-800 flex items-center gap-1"
        >
          <TrophyIcon className="h-3 w-3" />
          <span data-testid="xp-display">{xpEarned} XP</span>
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex items-center gap-1 text-amber-600 ml-2">
            <StarIcon className="h-3 w-3 fill-amber-500" />
            <span>{encouragementMessage}</span>
          </div>
        </div>
        <span>{Math.round(percentComplete)}% Complete</span>
      </div>

      <Progress value={percentComplete} className="h-1.5" />
    </CardHeader>
  );
}
