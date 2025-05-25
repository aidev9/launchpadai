"use client";

import React, { useState, useEffect } from "react";
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
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { useAtom } from "jotai";
import { useXpMutation } from "@/xp/useXpMutation";
import { useMutation } from "@tanstack/react-query";
import {
  currentWizardStepAtom,
  techStackWizardStateAtom,
  isEditModeAtom,
  selectedTechStackAtom,
} from "@/lib/store/techstack-store";
import { TechStack } from "@/lib/firebase/schema";
import { TechStackInput } from "@/lib/firebase/schema";
import {
  createTechStack,
  getTechStack,
  updateTechStack,
} from "@/lib/firebase/techstacks";
import { ArrowRight } from "lucide-react";

// Import step components
import { AppTypeStep } from "./components/steps/app-type-step";
import { FrontEndStep } from "./components/steps/frontend-step";
import { BackendStep } from "./components/steps/backend-step";
import { DatabaseStep } from "./components/steps/database-step";
import { AIAgentStep } from "./components/steps/ai-agent-step";
import { IntegrationsStep } from "./components/steps/integrations-step";
import { DeploymentStep } from "./components/steps/deployment-step";
import { AppDetailsStep } from "./components/steps/app-details-step";
import { PromptStep } from "./components/steps/prompt-step";
import { DocumentationLinksStep } from "./components/steps/documentation-links-step";
import { ReviewStep } from "./components/steps/review-step";
import { Skeleton } from "@/components/ui/skeleton";

// Import our step indicator component
import { StepIndicator } from "./components/step-indicator";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { selectedProductAtom } from "@/lib/store/product-store";
import { firebaseStacks } from "@/lib/firebase/client/FirebaseStacks";

export default function TechStackWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [isEditMode, setIsEditMode] = useAtom(isEditModeAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();
  const totalSteps = 11;

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
        duration: TOAST_DEFAULT_DURATION,
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
      case 1: // App Details (now first step)
        return !!wizardState.name && !!wizardState.description;
      case 2: // App Type (optional)
      case 3: // Front End Stack (optional)
      case 4: // Backend Stack (optional)
      case 5: // Database (optional)
      case 6: // AI Agent Stack (optional)
      case 7: // Integrations (optional)
      case 8: // Deployment Stack (optional)
      case 9: // Prompt (optional)
      case 10: // Documentation Links (optional)
        return true; // All other steps are optional
      default:
        return true;
    }
  };

  // Validate all steps up to the target step
  const validateStepsUpTo = (targetStep: number) => {
    // Only validate step 1 (App Details) as it's the only required step
    if (targetStep > 1) {
      setCurrentStep(1);
      if (!validateCurrentStep()) {
        toast({
          title: "Validation Error",
          description:
            "Please provide both app name and description before proceeding.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        return false;
      }
    }
    return true;
  };

  // Handle step click for navigation
  const handleStepClick = (step: number) => {
    // Only validate if moving forward and past step 1
    if (step > currentStep && step > 1) {
      if (validateStepsUpTo(2)) {
        // Only need to validate step 1
        setCurrentStep(step);
      }
    } else {
      // Moving backward or to step 1 doesn't require validation
      setCurrentStep(step);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    let success = false;
    const newStackIdForNavigation: string | undefined = undefined;
    const editStackIdForNavigation = selectedTechStack?.id || undefined;

    try {
      // Validate required fields before submission
      if (!wizardState.name || !wizardState.description) {
        toast({
          title: "Validation Error",
          description:
            "Please provide both app name and description before submitting.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsSubmitting(false);
        return;
      }

      // Make sure productId is set
      const productId = selectedProduct?.id || wizardState.productId || "";
      if (!productId) {
        toast({
          title: "Error",
          description: "Product ID is required. Please select a product first.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsSubmitting(false);
        return;
      }

      const techStackData: TechStackInput = {
        ...wizardState,
        productId: productId,
        userId: selectedTechStack?.userId || "",
      };

      // If we are in edit mode, update the tech stack
      if (isEditMode) {
        const result: TechStack | null = await firebaseStacks.updateTechStack(
          techStackData as TechStack
        );
        if (result) {
          setSelectedTechStack(result);
          success = true;
          toast({
            title: "Success",
            description: "Tech stack updated successfully.",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update tech stack",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } else {
        // If we are not in edit mode, create a new tech stack
        const result: TechStack | null = await firebaseStacks.createTechStack(
          techStackData as TechStack
        );

        if (result) {
          setSelectedTechStack(result);
          xpMutation.mutate("create_stack");
          success = true;
          toast({
            title: "Success",
            description: "Tech stack created successfully.",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create tech stack",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
      if (success) {
        router.push(`/mystacks/stack`);
      }
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <AppDetailsStep />;
      case 2:
        return <AppTypeStep />;
      case 3:
        return <FrontEndStep />;
      case 4:
        return <BackendStep />;
      case 5:
        return <DatabaseStep />;
      case 6:
        return <AIAgentStep />;
      case 7:
        return <IntegrationsStep />;
      case 8:
        return <DeploymentStep />;
      case 9:
        return <PromptStep />;
      case 10:
        return <DocumentationLinksStep />;
      case 11:
        return <ReviewStep onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <Main>
      {isLoading ? (
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[...Array(11)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "My Tech Stacks", href: "/mystacks" },
                  {
                    label: isEditMode ? "Edit Tech Stack" : "Create Tech Stack",
                    href: "",
                    isCurrentPage: true,
                  },
                ]}
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isEditMode ? "Edit Your Tech Stack" : "Create Your Tech Stack"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update your tech stack configuration."
                : "Select your preferred technologies to build your application."}
            </p>
          </div>

          {/* Enhanced Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepNames={[
              "App Details",
              "App Type",
              "Front End",
              "Backend",
              "Database",
              "AI Agent",
              "Integrations",
              "Deployment",
              "Prompt",
              "Documentation",
              "Review",
            ]}
            onStepClick={handleStepClick}
          />

          <Card className="mb-8 max-w-[90%]">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "App Details"}
                {currentStep === 2 && "Choose App Type (Optional)"}
                {currentStep === 3 && "Choose Front End Stack (Optional)"}
                {currentStep === 4 && "Choose Backend Stack (Optional)"}
                {currentStep === 5 && "Choose Database (Optional)"}
                {currentStep === 6 && "Choose AI Agent Stack (Optional)"}
                {currentStep === 7 && "Choose Integrations (Optional)"}
                {currentStep === 8 && "Choose Deployment Stack (Optional)"}
                {currentStep === 9 && "Add Prompt (Optional)"}
                {currentStep === 10 && "Add Documentation Links (Optional)"}
                {currentStep === 11 && "Review Your Tech Stack"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Provide details about your application."}
                {currentStep === 2 &&
                  "Select the type of application you want to build."}
                {currentStep === 3 &&
                  "Choose your preferred front-end technology."}
                {currentStep === 4 &&
                  "Choose your preferred backend technology."}
                {currentStep === 5 &&
                  "Select the database type for your application."}
                {currentStep === 6 &&
                  "Select AI agent technologies to include."}
                {currentStep === 7 &&
                  "Choose integrations for your application."}
                {currentStep === 8 &&
                  "Select your preferred deployment platform."}
                {currentStep === 9 &&
                  "Add a prompt you've already generated for this project."}
                {currentStep === 10 &&
                  "Add links to online documentation for your project."}
                {currentStep === 11 &&
                  "Review your selections before creating your tech stack."}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button onClick={goToNextStep} disabled={isSubmitting}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {/* Use isEditMode to determine button text */}
                    {isEditMode ? "Update Tech Stack" : "Create Tech Stack"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </Main>
  );
}
