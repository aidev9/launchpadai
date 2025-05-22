"use client";

import React, { useState, useEffect } from "react";
import {
  highlightedPromptIdAtom,
  selectedPromptAtom,
} from "@/lib/store/prompt-store";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAtom, useSetAtom } from "jotai";
import { ArrowRight } from "lucide-react";

// Import PACE store atoms
import {
  currentPaceStepAtom,
  paceWizardStateAtom,
  paceStateToPromptInput,
  resetPaceWizardAtom,
} from "@/lib/store/pace-store";

// Import step indicator component
import { StepIndicator } from "./components/step-indicator";

// Import step components (we'll create these next)
import { WelcomeStep } from "./components/steps/welcome-step";
import { ProblemStep } from "./components/steps/problem-step";
import { AskStep } from "./components/steps/ask-step";
import { ChainStep } from "./components/steps/chain-step";
import { EvaluateStep } from "./components/steps/evaluate-step";
import { SaveStep } from "./components/steps/save-step";
import { createPromptAction } from "../actions";

export default function PaceWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentPaceStepAtom);
  const [wizardState, setWizardState] = useAtom(paceWizardStateAtom);
  const [, resetWizard] = useAtom(resetPaceWizardAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Get the atom for highlighting prompts
  const [, setHighlightedPromptId] = useAtom(highlightedPromptIdAtom);
  // Get the atom for setting the selected prompt
  const setSelectedPrompt = useSetAtom(selectedPromptAtom);

  const totalSteps = 6;

  // Reset wizard state when component unmounts
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      resetWizard();
    };
  }, [resetWizard]);

  // Navigate to next step
  const goToNextStep = () => {
    // Validate current step
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Validate current step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Welcome (no validation needed)
        return true;
      case 2: // Problem
        return !!wizardState.problem.trim();
      case 3: // Ask
        return !!wizardState.ask.trim();
      case 4: // Chain (optional)
        return true;
      case 5: // Evaluate (optional)
        return true;
      case 6: // Save
        return !!wizardState.title.trim() && wizardState.phase.length > 0;
      default:
        return true;
    }
  };

  // Handle step click for navigation
  const handleStepClick = (step: number) => {
    // Only validate if moving forward
    if (step > currentStep) {
      // Check all steps up to the target
      for (let i = currentStep; i < step; i++) {
        setCurrentStep(i);
        if (!validateCurrentStep()) {
          toast({
            title: "Validation Error",
            description: `Please complete step ${i} before proceeding.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // If all validations pass or moving backward
    setCurrentStep(step);
  };

  // This is now declared at the component level

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate required fields before submission
      if (!wizardState.title || wizardState.phase.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please provide a title and select at least one phase.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert PACE state to prompt input
      const promptData = paceStateToPromptInput(wizardState);

      // Create new prompt
      const result = await createPromptAction(promptData);

      if (result.success && result.prompt) {
        toast({
          title: "Success",
          description: "PACE prompt created successfully.",
        });

        // Prepare for navigation without resetting state yet
        // This prevents the momentary display of the first step

        // First disable any UI interactions to prevent further changes
        setIsSubmitting(true);

        // Set the selected prompt for the detail view
        setSelectedPrompt(result.prompt);

        // Navigate to the prompt detail page
        router.push("/myprompts/prompt");

        // We don't reset the wizard state here, as it would cause the UI to flash
        // The state will be reset when the component unmounts or when the user returns
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create prompt",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <ProblemStep />;
      case 3:
        return <AskStep />;
      case 4:
        return <ChainStep />;
      case 5:
        return <EvaluateStep />;
      case 6:
        return <SaveStep onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <Main>
      <div className="mb-8">
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "My Prompts", href: "/myprompts" },
              {
                label: "Create PACE Prompt",
                href: "",
                isCurrentPage: true,
              },
            ]}
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Create PACE Prompt
        </h1>
        <p className="text-muted-foreground">
          Use the PACE framework to create effective prompts for AI tools.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepNames={["Welcome", "Problem", "Ask", "Chain", "Evaluate", "Save"]}
        onStepClick={handleStepClick}
      />

      <Card className="mb-8 max-w-[90%] mx-auto">
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Welcome to PACE Framework"}
            {currentStep === 2 && "Define Your Problem"}
            {currentStep === 3 && "Ask Precisely"}
            {currentStep === 4 && "Chain Outputs"}
            {currentStep === 5 && "Evaluate & Iterate"}
            {currentStep === 6 && "Save Your Prompt"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 &&
              "Learn how the PACE framework helps you create better prompts."}
            {currentStep === 2 &&
              "Clearly define the problem you're trying to solve."}
            {currentStep === 3 &&
              "Craft a precise prompt that will get the results you need."}
            {currentStep === 4 &&
              "Chain outputs to refine your results through sequential prompting."}
            {currentStep === 5 &&
              "Test and refine your prompt to ensure it produces the desired results."}
            {currentStep === 6 && "Save your prompt for future use."}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <div>
                {/* Empty div to maintain layout when no back button */}
              </div>
            )}
          </div>
          <div>
            {currentStep < totalSteps ? (
              <Button onClick={goToNextStep} disabled={isSubmitting}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Saving..." : "Save Prompt"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Main>
  );
}
