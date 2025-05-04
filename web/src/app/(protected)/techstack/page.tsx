"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAtom } from "jotai";
import {
  currentWizardStepAtom,
  techStackWizardStateAtom,
  selectedTechStackIdAtom,
  isEditModeAtom,
} from "@/lib/store/techstack-store";
import { TechStack, TechStackInput } from "@/lib/firebase/schema";
import {
  createTechStack,
  getTechStack,
  updateTechStack,
} from "@/lib/firebase/techstacks";
import { ArrowRight, Check } from "lucide-react";

// Import step components (we'll create these next)
import { AppTypeStep } from "@/app/(protected)/techstack/components/steps/app-type-step";
import { FrontEndStep } from "@/app/(protected)/techstack/components/steps/frontend-step";
import { BackendStep } from "@/app/(protected)/techstack/components/steps/backend-step";
import { DatabaseStep } from "@/app/(protected)/techstack/components/steps/database-step";
import { AIAgentStep } from "@/app/(protected)/techstack/components/steps/ai-agent-step";
import { IntegrationsStep } from "@/app/(protected)/techstack/components/steps/integrations-step";
import { DeploymentStep } from "@/app/(protected)/techstack/components/steps/deployment-step";
import { AppDetailsStep } from "@/app/(protected)/techstack/components/steps/app-details-step";
import { ReviewStep } from "@/app/(protected)/techstack/components/steps/review-step";

export default function TechStackWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [selectedTechStackId, setSelectedTechStackId] = useAtom(
    selectedTechStackIdAtom
  );
  const [isEditMode, setIsEditMode] = useAtom(isEditModeAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check if we're in edit mode by looking for an ID in the URL
  useEffect(() => {
    const techStackId = searchParams.get("id");
    if (techStackId) {
      setIsLoading(true);
      setIsEditMode(true);
      setSelectedTechStackId(techStackId);

      // Fetch the tech stack data
      getTechStack(techStackId)
        .then((result) => {
          if (result.success && result.techStack) {
            // Populate the wizard state with the tech stack data
            setWizardState({
              appType: result.techStack.appType || "",
              frontEndStack: result.techStack.frontEndStack || "",
              backendStack: result.techStack.backendStack || "",
              database: result.techStack.database || "",
              aiAgentStack: result.techStack.aiAgentStack || [],
              integrations: result.techStack.integrations || [],
              deploymentStack: result.techStack.deploymentStack || "",
              name: result.techStack.name || "",
              description: result.techStack.description || "",
              tags: result.techStack.tags || [],
              phase: result.techStack.phase || [],
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to load tech stack",
              variant: "destructive",
            });
            router.push("/mystacks");
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            variant: "destructive",
          });
          router.push("/mystacks");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Reset edit mode and selected tech stack ID if no ID in URL
      setIsEditMode(false);
      setSelectedTechStackId(null);
    }

    // Clean up function to reset state when component unmounts
    return () => {
      setIsEditMode(false);
      setSelectedTechStackId(null);
    };
  }, [
    searchParams,
    setIsEditMode,
    setSelectedTechStackId,
    setWizardState,
    toast,
    router,
  ]);

  const totalSteps = 9;

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
      case 1: // App Type
        return !!wizardState.appType;
      case 2: // Front End Stack
        return !!wizardState.frontEndStack;
      case 3: // Backend Stack
        return !!wizardState.backendStack;
      case 4: // Database
        return !!wizardState.database;
      case 5: // AI Agent Stack
        return wizardState.aiAgentStack.length > 0;
      case 6: // Integrations
        return wizardState.integrations.length > 0;
      case 7: // Deployment Stack
        return !!wizardState.deploymentStack;
      case 8: // App Details
        return !!wizardState.name;
      default:
        return true;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const techStackData: TechStackInput = {
        appType: wizardState.appType,
        frontEndStack: wizardState.frontEndStack,
        backendStack: wizardState.backendStack,
        database: wizardState.database,
        aiAgentStack: wizardState.aiAgentStack,
        integrations: wizardState.integrations,
        deploymentStack: wizardState.deploymentStack,
        name: wizardState.name,
        description: wizardState.description || "",
        tags: wizardState.tags,
        phase: wizardState.phase,
      };

      let result;

      if (isEditMode && selectedTechStackId) {
        // Update existing tech stack
        result = await updateTechStack(selectedTechStackId, techStackData);

        if (result.success) {
          toast({
            title: "Success",
            description: "Tech stack updated successfully.",
          });
        }
      } else {
        // Create new tech stack
        result = await createTechStack(techStackData);

        if (result.success) {
          toast({
            title: "Success",
            description:
              "Tech stack created successfully. Assets are being generated in the background.",
          });

          // Store the ID of the newly created tech stack
          if (result.id) {
            setSelectedTechStackId(result.id);
          }
        }
      }

      if (result.success) {
        // Reset the form state
        setWizardState({
          appType: "",
          frontEndStack: "",
          backendStack: "",
          database: "",
          aiAgentStack: [],
          integrations: [],
          deploymentStack: "",
          name: "",
          description: "",
          tags: [],
          phase: [],
        });

        // Reset the current step and edit mode
        setCurrentStep(1);
        setIsEditMode(false);

        // Redirect to the stack page
        // The app uses Jotai state management to store the selected tech stack
        // rather than URL parameters, so we just navigate to the stack page
        router.push("/mystacks/stack");
      } else {
        toast({
          title: "Error",
          description:
            result.error ||
            `Failed to ${isEditMode ? "update" : "create"} tech stack`,
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
        return <AppTypeStep />;
      case 2:
        return <FrontEndStep />;
      case 3:
        return <BackendStep />;
      case 4:
        return <DatabaseStep />;
      case 5:
        return <AIAgentStep />;
      case 6:
        return <IntegrationsStep />;
      case 7:
        return <DeploymentStep />;
      case 8:
        return <AppDetailsStep />;
      case 9:
        return <ReviewStep onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <Main>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/dashboard" },
                  {
                    label: isEditMode ? "Edit Tech Stack" : "Tech Stack Wizard",
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

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 max-w-[70%]">
            <div className="flex items-center w-full">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <React.Fragment key={`step-group-${index + 1}`}>
                  <div
                    key={`step-${index + 1}`}
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      currentStep >= index + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {currentStep > index + 1 ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      key={`line-${index + 1}`}
                      className={`flex-1 h-1 ${
                        currentStep > index + 1 ? "bg-primary" : "bg-muted"
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Card className="mb-8 max-w-[70%]">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Choose App Type"}
                {currentStep === 2 && "Choose Front End Stack"}
                {currentStep === 3 && "Choose Backend Stack"}
                {currentStep === 4 && "Choose Database"}
                {currentStep === 5 && "Choose AI Agent Stack"}
                {currentStep === 6 && "Choose Integrations"}
                {currentStep === 7 && "Choose Deployment Stack"}
                {currentStep === 8 && "App Details"}
                {currentStep === 9 && "Review Your Tech Stack"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 &&
                  "Select the type of application you want to build."}
                {currentStep === 2 &&
                  "Choose your preferred front-end technology."}
                {currentStep === 3 &&
                  "Choose your preferred backend technology."}
                {currentStep === 4 &&
                  "Select the database type for your application."}
                {currentStep === 5 &&
                  "Select AI agent technologies to include."}
                {currentStep === 6 &&
                  "Choose integrations for your application."}
                {currentStep === 7 &&
                  "Select your preferred deployment platform."}
                {currentStep === 8 && "Provide details about your application."}
                {currentStep === 9 &&
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
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
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
