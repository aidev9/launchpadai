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
import {
  currentWizardStepAtom,
  agentWizardStateAtom,
  isEditModeAtom,
  selectedAgentAtom,
} from "@/lib/store/agent-store";
import { Agent, Phases, AgentInput } from "@/lib/firebase/schema";
import { ArrowRight } from "lucide-react";

// Import step components
import { BasicInfoStep } from "./components/steps/basic-info-step";
import { SystemPromptStep } from "./components/steps/system-prompt-step";
import { CollectionsStep } from "./components/steps/collections-step";
import { ToolsStep } from "./components/steps/tools-step";
import { McpEndpointsStep } from "./components/steps/mcp-endpoints-step";
import { A2aEndpointsStep } from "./components/steps/a2a-endpoints-step";
import { ConfigurationStep } from "./components/steps/configuration-step";
import { ReviewStep } from "./components/steps/review-step";
import { Skeleton } from "@/components/ui/skeleton";

// Import our step indicator component
import { StepIndicator } from "./components/step-indicator";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";

// Initial wizard state
const initialWizardState: Agent = {
  id: "",
  userId: "",
  productId: "",
  name: "",
  description: "",
  systemPrompt: "",
  phases: [],
  tags: [],
  collections: [],
  tools: [],
  mcpEndpoints: [],
  a2aEndpoints: [],
  configuration: {
    url: "",
    apiKey: "",
    rateLimitPerMinute: 60,
    allowedIps: [],
    isEnabled: false,
  },
};

export default function AgentWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedAgent, setSelectedAgent] = useAtom(selectedAgentAtom);
  const [isEditMode, setIsEditMode] = useAtom(isEditModeAtom);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user] = useAuthState(clientAuth);
  const router = useRouter();
  const { toast } = useToast();

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();
  const totalSteps = 8;

  // Initialize wizard state when component mounts
  useEffect(() => {
    // Only initialize if we don't have wizard state yet and we have a user
    if (!wizardState && user) {
      // Check if we have a selected agent and are in edit mode
      if (selectedAgent && isEditMode) {
        // If we have a selected agent and are in edit mode, use the selected agent
        setWizardState(selectedAgent);
      } else {
        // Otherwise, initialize with default state for create mode
        setWizardState({
          ...initialWizardState,
          userId: user.uid,
        });
      }
    }
  }, [wizardState, setWizardState, user, selectedAgent, isEditMode]);

  // Navigate to next step
  const goToNextStep = () => {
    // Don't proceed if wizard state is still loading
    if (!wizardState) {
      return;
    }

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
    // Don't validate if wizard state hasn't been initialized yet
    if (!wizardState) {
      return false;
    }

    switch (currentStep) {
      case 1: // Basic Info (only name is required)
        return !!wizardState.name && wizardState.name.trim() !== "";
      case 2: // System Prompt (optional)
      case 3: // Collections (optional)
      case 4: // Tools (optional)
      case 5: // MCP Endpoints (optional)
      case 6: // A2A Endpoints (optional)
      case 7: // Configuration (optional)
        return true; // All other steps are optional
      default:
        return true;
    }
  };

  // Validate all steps up to the target step
  const validateStepsUpTo = (targetStep: number) => {
    // Don't validate if wizard state is still loading
    if (!wizardState) {
      return false;
    }

    // Only validate step 1 (Basic Info) as it's the only required step
    if (targetStep > 1) {
      const currentStepBackup = currentStep;
      setCurrentStep(1);
      const isValid = validateCurrentStep();
      setCurrentStep(currentStepBackup);
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please complete all required fields before proceeding.",
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
      if (validateStepsUpTo(step)) {
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

    try {
      if (!wizardState) {
        toast({
          title: "Error",
          description: "No agent data available",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsSubmitting(false);
        return;
      }

      // Validate required fields before submission
      if (!wizardState.name) {
        toast({
          title: "Validation Error",
          description: "Please provide an agent name before submitting.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsSubmitting(false);
        return;
      }

      // Create a complete Agent object with required fields
      const agentData: Agent = {
        ...wizardState,
        id: isEditMode && selectedAgent?.id ? selectedAgent.id : "",
        userId:
          isEditMode && selectedAgent?.userId
            ? selectedAgent.userId
            : wizardState.userId || "",
        name: wizardState.name || "",
        description: wizardState.description || "",
        systemPrompt: wizardState.systemPrompt || "",
        phases: wizardState.phases || [],
        tags: wizardState.tags || [],
        collections: wizardState.collections || [],
        tools: wizardState.tools || [],
        mcpEndpoints: wizardState.mcpEndpoints || [],
        a2aEndpoints: wizardState.a2aEndpoints || [],
        configuration: wizardState.configuration || {
          url: "",
          apiKey: "",
          rateLimitPerMinute: 60,
          allowedIps: [],
          isEnabled: false,
        },
      };

      // If we are in edit mode, update the agent
      if (isEditMode) {
        const result = await firebaseAgents.updateAgent(agentData);

        if (result) {
          setSelectedAgent(result);
          success = true;
          toast({
            title: "Success",
            description: "Agent updated successfully.",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update agent",
            variant: "destructive",
            duration: TOAST_DEFAULT_DURATION,
          });
        }
      } else {
        // If we are not in edit mode, create a new agent
        const result = await firebaseAgents.createAgent(agentData);

        if (result) {
          setSelectedAgent(result);
          xpMutation.mutate("create_agent");
          success = true;
          toast({
            title: "Success",
            description: "Agent created successfully.",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create agent",
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
        router.push(`/myagents/agent`);
      }
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <SystemPromptStep />;
      case 3:
        return <CollectionsStep />;
      case 4:
        return <ToolsStep />;
      case 5:
        return <McpEndpointsStep />;
      case 6:
        return <A2aEndpointsStep />;
      case 7:
        return <ConfigurationStep />;
      case 8:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <Main>
      {isLoading || !wizardState ? (
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
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
                  { label: "My Agents", href: "/myagents" },
                  {
                    label: isEditMode ? "Edit Agent" : "Create Agent",
                    href: "",
                    isCurrentPage: true,
                  },
                ]}
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isEditMode ? "Edit Your Agent" : "Create Your Agent"}
            </h1>

            <p className="text-muted-foreground">
              {isEditMode
                ? "Update your agent configuration."
                : "Configure your AI agent for use outside of LaunchpadAI."}
            </p>
          </div>

          {/* Enhanced Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepNames={[
              "Basic Info",
              "System Prompt",
              "Collections",
              "Tools",
              "MCP Endpoints",
              "A2A Endpoints",
              "Configuration",
              "Review",
            ]}
            onStepClick={handleStepClick}
          />

          <Card className="mb-8 max-w-[90%]">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "System Prompt"}
                {currentStep === 3 && "Knowledge Collections"}
                {currentStep === 4 && "Agent Tools"}
                {currentStep === 5 && "MCP Endpoints"}
                {currentStep === 6 && "Agent2Agent Endpoints"}
                {currentStep === 7 && "Agent Configuration"}
                {currentStep === 8 && "Review Your Agent"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Provide basic details about your agent."}
                {currentStep === 2 &&
                  "Select and customize a system prompt for your agent."}
                {currentStep === 3 &&
                  "Select collections to use as knowledge base."}
                {currentStep === 4 && "Choose tools for your agent to use."}
                {currentStep === 5 && "Add MCP endpoints for your agent."}
                {currentStep === 6 &&
                  "Add Agent2Agent endpoints for your agent."}
                {currentStep === 7 &&
                  "Configure access settings for your agent."}
                {currentStep === 8 &&
                  `Review your agent configuration before ${isEditMode ? "updating" : "creating"}.`}
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
                    {isEditMode ? "Update Agent" : "Create Agent"}
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
