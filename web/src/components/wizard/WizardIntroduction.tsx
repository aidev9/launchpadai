import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRightIcon,
  RocketIcon,
  LayersIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

type IntroductionStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const INTRODUCTION_STEPS: IntroductionStep[] = [
  {
    title: "Welcome to the AI Journey!",
    description:
      "Our wizard will guide you through creating AI-powered artifacts with a simple two-step approach.",
    icon: <RocketIcon className="h-12 w-12 text-blue-500" />,
  },
  {
    title: "Step 1: Product Creation",
    description:
      "First, you'll create a rich product context by defining business and technical details, features, and rules.",
    icon: <LayersIcon className="h-12 w-12 text-purple-500" />,
  },
  {
    title: "Step 2: Artifact Generation",
    description:
      "Then, you'll create prompts and assets that are contextualized to your product or feature.",
    icon: <SparklesIcon className="h-12 w-12 text-amber-500" />,
  },
  {
    title: "Benefits",
    description:
      "This approach leads to higher quality AI-generated artifacts and saves time through better-crafted prompts.",
    icon: <StarIcon className="h-12 w-12 text-green-500" />,
  },
];

type WizardIntroductionProps = {
  onComplete?: () => void;
  onNext?: () => void;
  onBack?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
};

export default function WizardIntroduction({
  onComplete,
  onNext,
  onBack,
  currentStep: externalCurrentStep,
  onStepChange,
}: WizardIntroductionProps) {
  const [internalStep, setInternalStep] = useState(0);

  // Use external step if provided, otherwise use internal step
  const currentStep = externalCurrentStep ?? internalStep;

  const handleNext = () => {
    if (currentStep < INTRODUCTION_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      if (onStepChange) {
        onStepChange(nextStep);
      } else {
        setInternalStep(nextStep);
      }
    } else {
      // On the last step, proceed to the next mini-wizard
      if (onNext) {
        onNext();
      } else if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (onStepChange) {
        onStepChange(prevStep);
      } else {
        setInternalStep(prevStep);
      }
    } else if (onBack) {
      onBack();
    }
  };

  const isLastStep = currentStep === INTRODUCTION_STEPS.length - 1;
  const step = INTRODUCTION_STEPS[currentStep];

  return (
    <div
      data-testid="wizard-introduction"
      className="min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 px-12"
    >
      <Card className="max-w-2xl w-full mx-auto shadow-xl">
        <CardHeader className="text-center space-y-1 pt-6">
          <div className="mx-auto" data-testid="intro-step-icon">
            {step.icon}
          </div>
          <h1
            className="text-2xl font-bold mt-3"
            data-testid="intro-step-title"
          >
            {step.title}
          </h1>
        </CardHeader>

        <CardContent className="text-center px-8 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className="text-lg text-muted-foreground"
                data-testid="intro-step-description"
              >
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center mt-6 space-x-2">
            {INTRODUCTION_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-10 rounded-full ${
                  index === currentStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
