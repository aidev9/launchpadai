import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import WizardHeader from "@/components/wizard/WizardHeader";
import WizardFooter from "@/components/wizard/WizardFooter";
import { useXp } from "@/xp/useXp";

type WizardLayoutProps = {
  title?: string;
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  progress?: number;
  percentComplete?: number;
  xpEarned?: number;
  totalXp?: number;
  encouragementMessage?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
  isSkipDisabled?: boolean;
  disableNext?: boolean;
  showNavigation?: boolean;
  showSkip?: boolean;
  nextButtonText?: string;
};

export default function WizardLayout({
  title = "LaunchpadAI Onboarding Wizard",
  children,
  currentStep,
  totalSteps,
  totalXp,
  progress,
  percentComplete = progress || 0,
  xpEarned,
  encouragementMessage = "You're doing great! Keep going!",
  onBack,
  onNext,
  onSkip,
  isBackDisabled = false,
  isNextDisabled = false,
  isSkipDisabled = false,
  disableNext = isNextDisabled,
  showNavigation = true,
  showSkip = false,
  nextButtonText,
}: WizardLayoutProps) {
  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4 py-8">
      {/* Fixed width card (75% of screen width) with max height (50vh) */}
      <Card className="w-3/4 max-h-[90vh] flex flex-col shadow-lg border-2 border-primary/20">
        {/* Header - starts from top */}
        <WizardHeader
          title={title}
          currentStep={currentStep}
          totalSteps={totalSteps}
          percentComplete={percentComplete}
          xpEarned={totalXp || 0}
          encouragementMessage={encouragementMessage}
        />

        {/* Content - scrollable if needed */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          {children}
        </CardContent>

        {/* Footer - Navigation buttons aligned to bottom */}
        {showNavigation && (
          <WizardFooter
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
            isBackDisabled={isBackDisabled}
            isNextDisabled={disableNext || isNextDisabled}
            isSkipDisabled={isSkipDisabled}
            showSkip={showSkip}
            nextButtonText={nextButtonText}
          />
        )}
      </Card>
    </div>
  );
}
