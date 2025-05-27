import React, { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { TechStack, TechStackInput } from "@/lib/firebase/schema";
import { useToast } from "@/components/ui/use-toast";
import { firebaseStacks } from "@/lib/firebase/client/FirebaseStacks";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { productAtom, selectedTechStackAtom } from "@/lib/store/product-store";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import { techStackWizardStateAtom } from "@/lib/store/techstack-store";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MiniWizardBase, { MiniWizardProps } from "./MiniWizardBase";
import { MiniWizardId } from "@/lib/firebase/schema/enums";

// Step components
import AppDetailsStep from "./tech-stack-steps/AppDetailsStep";
import AppTypeStep from "./tech-stack-steps/AppTypeStep";
import FrontendStep from "./tech-stack-steps/FrontendStep";
import BackendStep from "./tech-stack-steps/BackendStep";
import DatabaseStep from "./tech-stack-steps/DatabaseStep";
import AIAgentStep from "./tech-stack-steps/AIAgentStep";
import IntegrationsStep from "./tech-stack-steps/IntegrationsStep";
import DeploymentStep from "./tech-stack-steps/DeploymentStep";
import PromptStep from "./tech-stack-steps/PromptStep";
import DocumentationStep from "./tech-stack-steps/DocumentationStep";

// Define the 10 steps for the tech stack wizard
const TECH_STACK_STEPS = [
  {
    name: "App Details",
    description: "Provide details about your application",
    required: true,
  },
  {
    name: "App Type",
    description: "Select the type of application you want to build",
    required: false,
  },
  {
    name: "Frontend",
    description: "Choose your preferred front-end technology",
    required: false,
  },
  {
    name: "Backend",
    description: "Choose your preferred backend technology",
    required: false,
  },
  {
    name: "Database",
    description: "Select the database type for your application",
    required: false,
  },
  {
    name: "AI Agent",
    description: "Select AI agent technologies to include",
    required: false,
  },
  {
    name: "Integrations",
    description: "Choose integrations for your application",
    required: false,
  },
  {
    name: "Deployment",
    description: "Select your preferred deployment platform",
    required: false,
  },
  {
    name: "Prompt",
    description: "Add a prompt you've already generated for this project",
    required: false,
  },
  {
    name: "Documentation",
    description: "Add links to online documentation for your project",
    required: false,
  },
] as const;

export default function CreateTechnicalStackWizard({
  onBack,
  onComplete,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
>) {
  const [user] = useAuthState(clientAuth);
  const [product] = useAtom(productAtom);
  const [selectedTechStack, setSelectedTechStack] = useAtom(
    selectedTechStackAtom
  );
  const [globalStep] = useAtom(globalWizardStepAtom);
  const { toast } = useToast();

  // Use persistent wizard state instead of local state
  const [wizardState, setWizardState] = useAtom(techStackWizardStateAtom);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showOther, setShowOther] = useState<{ [key: string]: boolean }>({});
  const [otherValues, setOtherValues] = useState<{ [key: string]: string }>({});

  // Get current step from global state (tech stack is mainStep 3, so subStep is the current step)
  const [mainStep, subStep] = globalStep;
  const currentStep = mainStep === 3 ? subStep : 1; // Only show content if we're in tech stack wizard

  // Validate step range
  const validatedStep = Math.max(1, Math.min(10, currentStep));
  const currentStepInfo = TECH_STACK_STEPS[validatedStep - 1];

  // Navigation functions
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      // Handled by MainWizard
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const goToPreviousStep = () => {
    // Handled by MainWizard
  };

  // Validate current step
  const validateCurrentStep = () => {
    if (currentStepInfo.required) {
      // Only step 1 (App Details) is required
      if (validatedStep === 1) {
        // Get the validation function from the AppDetailsStep component
        const appDetailsStep = (window as any).currentAppDetailsStep;
        if (appDetailsStep && appDetailsStep.validateFields) {
          return appDetailsStep.validateFields();
        }

        // Fallback validation in case the component hasn't mounted or its validateFields isn't available.
        // AppDetailsStep's internal useEffect should have already set its own error states based on wizardState.
        const hasName = !!wizardState.name?.trim();
        const hasDescription = !!wizardState.description?.trim();
        const hasPhases = wizardState.phases && wizardState.phases.length > 0;

        if (!hasName || !hasDescription || !hasPhases) {
          // Toast removed. AppDetailsStep is responsible for displaying inline errors.
          // console.warn(
          //   "Fallback validation triggered for AppDetailsStep. Inline errors should be shown by AppDetailsStep itself."
          // );
          return false;
        }
      }
    }
    return true; // All other steps are optional
  };

  // Removed unused stepTitles array

  // Initialize form state when component mounts or product changes
  useEffect(() => {
    // Only initialize if the form is empty or productId doesn't match
    if (!wizardState.productId || wizardState.productId !== product?.id) {
      setWizardState((prev) => ({
        ...prev,
        userId: user?.uid || "",
        productId: product?.id || "",
        // Keep existing form data if it exists, only update user/product IDs
      }));
    }
  }, [product, user, wizardState.productId, setWizardState]);

  // Populate form from selectedTechStack when it exists
  useEffect(() => {
    if (
      selectedTechStack &&
      selectedTechStack.id &&
      (!wizardState.id || wizardState.id !== selectedTechStack.id)
    ) {
      console.log(
        "[CreateTechnicalStackWizard] Populating form from selectedTechStack:",
        selectedTechStack
      );
      setWizardState({
        id: selectedTechStack.id,
        appType: selectedTechStack.appType || "",
        frontEndStack: selectedTechStack.frontEndStack || "",
        backEndStack: selectedTechStack.backEndStack || "",
        databaseStack: selectedTechStack.databaseStack || "",
        aiAgentStack: selectedTechStack.aiAgentStack || [],
        integrations: selectedTechStack.integrations || [],
        deploymentStack: selectedTechStack.deploymentStack || "",
        name: selectedTechStack.name || "",
        description: selectedTechStack.description || "",
        tags: selectedTechStack.tags || [],
        phases: selectedTechStack.phases || [],
        prompt: selectedTechStack.prompt || "",
        documentationLinks: selectedTechStack.documentationLinks || [],
        productId: selectedTechStack.productId || product?.id || "",
        userId: selectedTechStack.userId || user?.uid || "",
      });
    }
  }, [
    selectedTechStack,
    wizardState.id,
    setWizardState,
    product?.id,
    user?.uid,
  ]);

  // Update showOther state based on current values to handle existing custom values
  useEffect(() => {
    const standardAppTypes = [
      "Full-stack web app",
      "Mobile app",
      "AI Agent",
      "API/Service",
    ];
    const standardFrontends = [
      "React/NextJS",
      "Flask/Django",
      "Angular",
      "Vue.js",
    ];
    const standardBackends = ["Node.js", "Python", ".NET", "Java"];
    const standardDatabases = ["PostgreSQL", "MySQL", "MongoDB", "Firebase"];
    const standardDeployments = ["Vercel", "Netlify", "AWS", "Google Cloud"];

    setShowOther({
      appType: !!(
        wizardState.appType && !standardAppTypes.includes(wizardState.appType)
      ),
      frontend: !!(
        wizardState.frontEndStack &&
        !standardFrontends.includes(wizardState.frontEndStack)
      ),
      backend: !!(
        wizardState.backEndStack &&
        !standardBackends.includes(wizardState.backEndStack)
      ),
      database: !!(
        wizardState.databaseStack &&
        !standardDatabases.includes(wizardState.databaseStack)
      ),
      deployment: !!(
        wizardState.deploymentStack &&
        !standardDeployments.includes(wizardState.deploymentStack)
      ),
    });
  }, [wizardState]);

  // Calculate progress
  const getCurrentStepProgress = () => {
    switch (validatedStep) {
      case 1: // App Details (required)
        const hasName = !!wizardState.name;
        const hasDescription = !!wizardState.description;
        if (hasName && hasDescription) return 100;
        if (hasName || hasDescription) return 50;
        return 0;
      case 2: // App Type
        return !!wizardState.appType ? 100 : 0;
      case 3: // Frontend
        return !!wizardState.frontEndStack ? 100 : 0;
      case 4: // Backend
        return !!wizardState.backEndStack ? 100 : 0;
      case 5: // Database
        return !!wizardState.databaseStack ? 100 : 0;
      case 6: // AI Agent
        return (wizardState.aiAgentStack || []).length > 0 ? 100 : 0;
      case 7: // Integrations
        return (wizardState.integrations || []).length > 0 ? 100 : 0;
      case 8: // Deployment
        return !!wizardState.deploymentStack ? 100 : 0;
      case 9: // Prompt
        return !!wizardState.prompt ? 100 : 0;
      case 10: // Documentation
        return (wizardState.documentationLinks || []).length > 0 ? 100 : 0;
      default:
        return 0;
    }
  };

  const getOverallProgress = () => {
    let totalProgress = 0;
    for (let i = 1; i <= 10; i++) {
      if (i < validatedStep) {
        totalProgress += 100; // Completed steps
      } else if (i === validatedStep) {
        totalProgress += getCurrentStepProgress(); // Current step progress
      }
      // Future steps contribute 0
    }
    return totalProgress / 10; // Average across 10 steps
  };

  // Handle final submit
  const handleFinalSubmit = useCallback(async () => {
    // Validate required fields
    if (!wizardState.name || wizardState.name.trim() === "") {
      setFormError("Stack Name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    let isUpdate = false; // Declare outside try block

    try {
      // Create the tech stack data
      const techStackData: TechStackInput = {
        ...wizardState,
        productId: product?.id || wizardState.productId || "",
        userId: user?.uid || "",
      };

      let result;

      // Check if we already have a selected tech stack (update vs create)
      if (selectedTechStack && selectedTechStack.id) {
        console.log(
          "[CreateTechnicalStackWizard] Tech stack already exists, updating:",
          selectedTechStack.id
        );

        // Update existing tech stack
        result = await firebaseStacks.updateTechStack({
          ...techStackData,
          id: selectedTechStack.id,
        } as TechStack);
        isUpdate = true;
        console.log(
          "[CreateTechnicalStackWizard] Firebase update result:",
          result
        );
      } else {
        // Create new tech stack
        console.log(
          "[CreateTechnicalStackWizard] Creating new tech stack with data:",
          techStackData
        );
        result = await firebaseStacks.createTechStack(
          techStackData as TechStack
        );
        console.log(
          "[CreateTechnicalStackWizard] Firebase create result:",
          result
        );
      }

      if (result) {
        toast({
          title: isUpdate ? "Tech Stack Updated" : "Tech Stack Created",
          description: `Tech stack ${isUpdate ? "updated" : "created"} successfully!`,
        });

        // Set the selected tech stack atom for wizard flow
        setSelectedTechStack(result);

        // Don't reset the form state - keep it populated for future edits
        // The form will be populated from selectedTechStack when navigating back

        if (onComplete) {
          onComplete(wizardState);
        }
      } else {
        throw new Error(
          `Failed to ${isUpdate ? "update" : "create"} tech stack`
        );
      }
    } catch (error) {
      console.error("Error creating/updating tech stack:", error);
      setFormError(
        error instanceof Error ? error.message : "An error occurred"
      );
      const isUpdate = selectedTechStack && selectedTechStack.id;
      toast({
        title: "Error",
        description: `Failed to ${isUpdate ? "update" : "create"} tech stack. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedTechStack,
    wizardState,
    product?.id,
    user?.uid,
    toast,
    onComplete,
    setSelectedTechStack,
  ]);

  // Expose navigation functions to parent component
  const validateCurrentStepCallback = useCallback(() => {
    if (currentStepInfo.required) {
      // Only step 1 (App Details) is required
      if (validatedStep === 1) {
        // Get the validation function from the AppDetailsStep component
        const appDetailsStep = (window as any).currentAppDetailsStep;
        if (appDetailsStep && appDetailsStep.validateFields) {
          // AppDetailsStep will show its own inline errors
          return appDetailsStep.validateFields();
        }
        // If AppDetailsStep or its validation function isn't available for some reason,
        // consider it a validation failure, but AppDetailsStep should handle showing errors.
        // No toast here.
        return false;
      }
    }
    return true; // All other steps are optional
  }, [
    currentStepInfo.required,
    validatedStep,
  ]);

  React.useEffect(() => {
    if (mainStep === 3) {
      const wizard = {
        goToNextStep,
        goToPreviousStep,
        handleFinalSubmit,
        canGoNext: () => validateCurrentStepCallback(),
        canGoBack: () => validatedStep > 1,
        isLastStep: () => validatedStep === 10,
      };

      // Store wizard functions globally so MainWizard can access them
      (window as any).currentTechStackWizard = wizard; // TODO: Fix typing
    }
  }, [
    validatedStep,
    handleFinalSubmit,
    mainStep,
    goToNextStep,
    goToPreviousStep,
    validateCurrentStepCallback,
  ]);

  // Form field update helpers
  const updateField = (field: keyof TechStack, value: any) => {
    setWizardState((prev) => ({ ...prev, [field]: value }));
  };

  // Render current step content
  const renderStepContent = () => {
    switch (validatedStep) {
      case 1:
        return (
          <AppDetailsStep
            wizardState={wizardState}
            updateField={updateField}
            product={product}
          />
        );
      case 2:
        return (
          <AppTypeStep
            wizardState={wizardState}
            updateField={updateField}
            showOther={showOther}
            setShowOther={setShowOther}
          />
        );
      case 3:
        return (
          <FrontendStep
            wizardState={wizardState}
            updateField={updateField}
            showOther={showOther}
            setShowOther={setShowOther}
          />
        );
      case 4:
        return (
          <BackendStep
            wizardState={wizardState}
            updateField={updateField}
            showOther={showOther}
            setShowOther={setShowOther}
          />
        );
      case 5:
        return (
          <DatabaseStep
            wizardState={wizardState}
            updateField={updateField}
            showOther={showOther}
            setShowOther={setShowOther}
          />
        );
      case 6:
        return (
          <AIAgentStep
            wizardState={wizardState}
            updateField={updateField}
            otherValues={otherValues}
            setOtherValues={setOtherValues}
          />
        );
      case 7:
        return (
          <IntegrationsStep
            wizardState={wizardState}
            updateField={updateField}
            otherValues={otherValues}
            setOtherValues={setOtherValues}
          />
        );
      case 8:
        return (
          <DeploymentStep
            wizardState={wizardState}
            updateField={updateField}
            showOther={showOther}
            setShowOther={setShowOther}
          />
        );
      case 9:
        return (
          <PromptStep wizardState={wizardState} updateField={updateField} />
        );
      case 10:
        return (
          <DocumentationStep
            wizardState={wizardState}
            updateField={updateField}
          />
        );
      default:
        return null;
    }
  };

  // Don't render if we're not in the tech stack wizard (mainStep 3)
  if (mainStep !== 3) {
    return null;
  }

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.CREATE_TECHNICAL_STACK}
      title="Create Technical Stack"
      description="Define the technical aspects of your product to help AI understand your development approach."
      xpReward={50}
      onBack={onBack}
      onComplete={onComplete}
    >
      <div className="space-y-6 px-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {TECH_STACK_STEPS.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 === validatedStep
                      ? "bg-blue-600 text-white"
                      : index + 1 < validatedStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1 < validatedStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < TECH_STACK_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Step {validatedStep}: {currentStepInfo.name}
            {currentStepInfo.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentStepInfo.description}
          </p>
        </div>

        {/* Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step Progress</span>
              <span>{Math.round(getCurrentStepProgress())}%</span>
            </div>
            <Progress value={getCurrentStepProgress()} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </div>

        {formError && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {formError}
          </div>
        )}

        {renderStepContent()}

        {/* Step completion status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getCurrentStepProgress() === 100 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">
              {getCurrentStepProgress() === 100
                ? `${currentStepInfo.name} complete!`
                : currentStepInfo.required
                  ? `Complete the ${currentStepInfo.name.toLowerCase()} to continue.`
                  : `${currentStepInfo.name} ready! Add information as needed.`}
            </span>
          </div>
        </div>

        {/* Final submission button for last step */}
        {/* {validatedStep === 10 && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleFinalSubmit}
              disabled={
                isSubmitting || !wizardState.name || !wizardState.description
              }
              className="w-full"
            >
              {isSubmitting
                ? "Creating Tech Stack..."
                : selectedTechStack && selectedTechStack.id
                  ? "Update Tech Stack"
                  : "Create Tech Stack"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete the tech stack wizard and continue to the next step.
            </p>
          </div>
        )} */}
      </div>
    </MiniWizardBase>
  );
}
