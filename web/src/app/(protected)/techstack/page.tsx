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
  selectedTechStackAtom,
  isEditModeAtom,
} from "@/lib/store/techstack-store";
import { TechStack, TechStackInput } from "@/lib/firebase/schema";
import {
  createTechStack,
  getTechStack,
  updateTechStack,
} from "@/lib/firebase/techstacks";
import { ArrowRight } from "lucide-react";

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

// Import our new step indicator component
import { StepIndicator } from "@/app/(protected)/techstack/components/step-indicator";

export default function TechStackWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);
  const [selectedTechStackId, setSelectedTechStackId] = useAtom(
    selectedTechStackIdAtom
  );
  const [_, setSelectedTechStack] = useAtom(selectedTechStackAtom);
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
      case 1: // App Details (now first step)
        return !!wizardState.name && !!wizardState.description;
      case 2: // App Type (optional)
      case 3: // Front End Stack (optional)
      case 4: // Backend Stack (optional)
      case 5: // Database (optional)
      case 6: // AI Agent Stack (optional)
      case 7: // Integrations (optional)
      case 8: // Deployment Stack (optional)
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
    try {
      // Validate required fields before submission
      if (!wizardState.name || !wizardState.description) {
        toast({
          title: "Validation Error",
          description:
            "Please provide both app name and description before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const techStackData: TechStackInput = {
        appType: wizardState.appType,
        frontEndStack: wizardState.frontEndStack,
        backendStack: wizardState.backendStack,
        database: wizardState.database,
        // Use empty arrays for optional fields if not provided
        aiAgentStack:
          wizardState.aiAgentStack.length > 0 ? wizardState.aiAgentStack : [],
        integrations:
          wizardState.integrations.length > 0 ? wizardState.integrations : [],
        deploymentStack: wizardState.deploymentStack || "None specified",
        name: wizardState.name,
        description: wizardState.description,
        tags: wizardState.tags,
        phase: wizardState.phase,
        documentationLinks: [], // Add missing property, assuming it's not collected in the wizard
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
            console.log("New tech stack created with ID:", result.id);

            // Set the ID first
            setSelectedTechStackId(result.id);
            console.log("Updated selectedTechStackId atom:", result.id);

            // Fetch the newly created tech stack to update the selectedTechStack atom
            const techStackResult = await getTechStack(result.id);
            console.log("Fetched tech stack result:", techStackResult);

            if (techStackResult.success && techStackResult.techStack) {
              // Update the selectedTechStack atom with the newly created tech stack
              const newTechStack = techStackResult.techStack;
              console.log("Setting selectedTechStack atom to:", newTechStack);
              setSelectedTechStack(newTechStack);

              // Force a small delay to ensure state is updated before navigation
              await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
              console.error(
                "Failed to fetch newly created tech stack:",
                techStackResult.error
              );
            }
          } else {
            console.error("Created tech stack but no ID was returned");
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
        console.log("About to navigate to stack page");
        console.log("Current selectedTechStackId:", selectedTechStackId);

        // Add the tech stack ID to the URL to ensure correct routing
        if (!isEditMode && result.id) {
          console.log("Navigating to stack page with ID:", result.id);
          router.push(`/mystacks/stack?id=${result.id}`);
        } else {
          console.log("Navigating to stack page without ID");
          router.push("/mystacks/stack");
        }
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
              "Review",
            ]}
            onStepClick={handleStepClick}
          />

          <Card className="mb-8 max-w-[70%]">
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
                {currentStep === 9 && "Review Your Tech Stack"}
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
