import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import WizardHeader from "@/components/wizard/WizardHeader";
import WizardFooter from "@/components/wizard/WizardFooter";
import PlaygroundCard from "@/components/wizard/PlaygroundCard";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  onReset?: () => void;
  onSaveAndFinishLater?: () => void;
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
  encouragementMessage = "You're doing great! Keep going!",
  onBack,
  onNext,
  onSkip,
  onReset,
  onSaveAndFinishLater,
  isBackDisabled = false,
  isNextDisabled = false,
  isSkipDisabled = false,
  disableNext = isNextDisabled,
  showNavigation = true,
  showSkip = false,
  nextButtonText,
}: WizardLayoutProps) {
  // Determine if current content is a celebration screen by checking showNavigation
  // When showCelebration is true in MainWizard, it sets showNavigation to false
  const isCelebrationStep = !showNavigation;

  // Determine if current step is special (first, last, or celebration)
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 10;
  const isSpecialStep = isFirstStep || isLastStep || isCelebrationStep;
  const showPlayground = !isSpecialStep;

  // Set playground panel default size
  const playgroundDefaultSize = showPlayground ? 40 : 0;

  // Set width based on whether playground is shown
  const containerWidthClass = showPlayground ? "w-[99%]" : "w-[60%]";

  return (
    <div className="flex flex-col w-full">
      {/* Simple Header */}
      <header className="bg-primary/10 h-12 border-b border-primary/20 flex items-center">
        <Link href="/">
          <div className="flex items-center gap-2 text-primary font-bold px-6">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>LaunchpadAI</span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex justify-center items-center px-4 py-6">
        <div
          className={`${containerWidthClass} h-[85vh] mx-auto max-w-[1800px] min-w-[600px] ${
            isCelebrationStep ? "flex justify-center items-center" : ""
          }`}
        >
          <ResizablePanelGroup direction="horizontal">
            {/* Wizard Panel */}
            <ResizablePanel>
              <Card className="h-full flex flex-col shadow-lg">
                {/* Header - starts from top with full width */}
                <WizardHeader
                  title={title}
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  percentComplete={percentComplete}
                  xpEarned={totalXp || 0}
                  encouragementMessage={encouragementMessage}
                />

                {/* Content - scrollable if needed */}
                <CardContent
                  className={`flex-1 overflow-y-auto ${
                    isSpecialStep
                      ? "p-0 flex items-center justify-center"
                      : "p-4"
                  }`}
                >
                  <div className="h-full w-full">
                    {isSpecialStep && !isCelebrationStep ? (
                      <div
                        className={`flex items-center justify-center h-full w-full ${
                          isFirstStep ? "bg-blue-50" : "bg-green-50"
                        }`}
                      >
                        {children}
                      </div>
                    ) : (
                      children
                    )}
                  </div>
                </CardContent>

                {/* Footer - Navigation buttons aligned to bottom */}
                {showNavigation && (
                  <WizardFooter
                    onBack={onBack}
                    onNext={onNext}
                    onSkip={onSkip}
                    onReset={onReset}
                    onSaveAndFinishLater={onSaveAndFinishLater}
                    isBackDisabled={isBackDisabled}
                    isNextDisabled={disableNext || isNextDisabled}
                    isSkipDisabled={isSkipDisabled}
                    showSkip={showSkip}
                    nextButtonText={nextButtonText}
                  />
                )}
              </Card>
            </ResizablePanel>

            {/* Resizable Handle - only shown when playground is visible */}
            {showPlayground && (
              <ResizableHandle withHandle className="mx-2 w-1 px-2 bg-muted" />
            )}

            {/* Playground Panel with Collapse Button - only shown when needed */}
            {showPlayground && (
              <ResizablePanel
                defaultSize={playgroundDefaultSize}
                minSize={15}
                maxSize={85}
              >
                <PlaygroundCard />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-primary/5 h-8 border-t border-primary/20 text-center text-xs text-muted-foreground flex items-center justify-center">
        {new Date().getFullYear()} LaunchpadAI. All rights reserved.
      </footer>
    </div>
  );
}
