import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import WizardHeader from "@/components/wizard/WizardHeader";
import WizardFooter from "@/components/wizard/WizardFooter";
import PlaygroundCard from "@/components/wizard/PlaygroundCard";
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
  // Determine if playground should be shown (all steps except introduction and completion)
  const [mainStep] = Array.isArray(currentStep) ? [currentStep[0]] : [currentStep];
  const showPlayground = mainStep > 0 && mainStep < 9;

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4 py-8">
      <div className={`flex ${showPlayground ? 'w-[95%] gap-4' : 'w-3/4'}`}>
        {/* Main content - 60% width when playground is visible, otherwise same as before */}
        <Card className={`${showPlayground ? 'w-[60%]' : 'w-full'} max-h-[90vh] flex flex-col shadow-lg border-2 border-primary/20`}>
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

        {/* Playground card - 40% width, only shown for steps other than intro and completion */}
        {showPlayground && (
          <div className="w-[40%] max-h-[90vh]">
            <PlaygroundCard />
          </div>
        )}
      </div>
    </div>
  );
}
