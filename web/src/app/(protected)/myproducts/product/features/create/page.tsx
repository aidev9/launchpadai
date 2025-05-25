"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useXpMutation } from "@/xp/useXpMutation";
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
  currentFeatureWizardStepAtom,
  featureWizardStateAtom,
  selectedFeatureIdAtom,
  isEditModeAtom,
  selectedFeatureAtom,
} from "@/lib/store/feature-store";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Feature, FeatureInput } from "@/lib/firebase/schema";
import { createFeature, updateFeature } from "@/lib/firebase/features";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Import step components
import { ProductStep } from "./components/steps/product-step";
import { DetailsStep } from "./components/steps/details-step";
import { ReviewStep } from "./components/steps/review-step";

// Import our step indicator component
import { StepIndicator } from "./components/step-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeatureWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentFeatureWizardStepAtom);
  const [wizardState, setWizardState] = useAtom(featureWizardStateAtom);
  const [selectedFeatureId, setSelectedFeatureId] = useAtom(
    selectedFeatureIdAtom
  );
  const [, setSelectedFeature] = useAtom(selectedFeatureAtom);
  const [isEditMode, setIsEditMode] = useAtom(isEditModeAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProduct] = useAtom(selectedProductAtom);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Get the product ID from Jotai atoms
  const productId = wizardState.productId || selectedProduct?.id;

  // Get the selected feature from the atom (set by parent page)
  const [selectedFeature] = useAtom(selectedFeatureAtom);

  // Initialize wizard state based on edit mode
  useEffect(() => {
    // Set loading state while we determine what to do
    setIsLoading(true);

    // Check if we're in edit mode by looking at the selectedFeature atom
    if (selectedFeature && selectedFeature.id) {
      // We're in edit mode
      setIsEditMode(true);
      setSelectedFeatureId(selectedFeature.id);

      // Populate the wizard state with the feature data from the atom
      setWizardState({
        productId: selectedFeature.productId,
        name: selectedFeature.name || "",
        description: selectedFeature.description || "",
        status: selectedFeature.status || "Draft",
        tags: selectedFeature.tags || [],
      });

      // Skip to the details step
      setCurrentStep(2);
    } else if (productId) {
      // If we have a product ID but no feature, we're creating a new feature
      // Set the product ID in the wizard state
      setWizardState({
        productId,
        name: "",
        description: "",
        status: "Draft",
        tags: [],
      });

      // Skip the product selection step
      setCurrentStep(2);

      // Reset edit mode and selected feature ID
      setIsEditMode(false);
      setSelectedFeatureId(null);
    } else {
      // If we don't have a product ID, we need to select one
      setWizardState({
        productId: "",
        name: "",
        description: "",
        status: "Draft",
        tags: [],
      });

      setIsEditMode(false);
      setSelectedFeatureId(null);
      setCurrentStep(1);
    }

    // Finish loading
    setIsLoading(false);

    // Clean up function to reset state when component unmounts
    return () => {
      setIsEditMode(false);
      setSelectedFeatureId(null);
    };
  }, [
    selectedFeature,
    productId,
    setIsEditMode,
    setSelectedFeatureId,
    setWizardState,
    setCurrentStep,
  ]);

  const totalSteps = 3;

  // Calculate progress for current step
  const getCurrentStepProgress = () => {
    switch (currentStep) {
      case 1: // Product Step
        const hasProductId = !!wizardState.productId;
        return hasProductId ? 100 : 0;
      case 2: // Details Step
        const hasName = !!wizardState.name;
        const hasDescription = !!wizardState.description;
        const hasStatus = !!wizardState.status;
        const hasTags = wizardState.tags && wizardState.tags.length > 0;

        let completedFields = 0;
        if (hasName) completedFields++;
        if (hasDescription) completedFields++;
        if (hasStatus) completedFields++;
        if (hasTags) completedFields++;

        return (completedFields / 4) * 100;
      case 3: // Review Step
        return 100; // Review step is always complete when reached
      default:
        return 0;
    }
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    let totalProgress = 0;
    for (let i = 1; i <= totalSteps; i++) {
      if (i < currentStep) {
        totalProgress += 100; // Completed steps
      } else if (i === currentStep) {
        totalProgress += getCurrentStepProgress(); // Current step progress
      }
      // Future steps contribute 0
    }
    return totalProgress / totalSteps; // Average across all steps
  };

  // Navigate to next step
  const goToNextStep = () => {
    // Validate current step
    if (validateCurrentStep(currentStep)) {
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
  const validateCurrentStep = (step = currentStep) => {
    switch (step) {
      case 1: // Product Step
        const isProductValid = !!wizardState.productId;
        return isProductValid;
      case 2: // Details Step
        const isNameValid = !!wizardState.name;
        const isDescriptionValid = !!wizardState.description;
        return isNameValid && isDescriptionValid;
      default:
        return true;
    }
  };

  // Handle step click for navigation
  const handleStepClick = (step: number) => {
    // Only validate if moving forward
    if (step > currentStep) {
      // Validate current step first
      if (!validateCurrentStep(currentStep)) {
        toast({
          title: "Validation Error",
          description: "Please complete all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
    }

    // If validation passes or moving backward, update the step
    setCurrentStep(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!wizardState.productId) {
      toast({
        title: "Error",
        description: "Product ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let success = false;

    try {
      // Validate required fields before submission
      if (!wizardState.name || !wizardState.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Use type assertion to handle the updated status options
      const featureData = {
        name: wizardState.name,
        description: wizardState.description,
        status: wizardState.status,
        tags: wizardState.tags,
        productId: wizardState.productId,
      } as any as FeatureInput;

      if (isEditMode && selectedFeatureId) {
        const result = await updateFeature(
          selectedFeatureId,
          wizardState.productId,
          featureData
        );
        if (result.success) {
          toast({
            title: "Success",
            description: "Feature updated successfully.",
          });
          success = true;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update feature",
            variant: "destructive",
          });
        }
      } else {
        const result = await createFeature(featureData);
        if (result.success && result.id) {
          // Award XP for creating a feature - using background mutation
          xpMutation.mutate("create_feature");

          toast({
            title: "Success",
            description: "Feature created successfully. +50 XP awarded!",
          });
          setSelectedFeatureId(result.id);
          setSelectedFeature(null);
          success = true;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create feature",
            variant: "destructive",
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
      });
    } finally {
      setIsSubmitting(false);
      if (success) {
        router.push("/myproducts/product/features");
      }
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ProductStep />;
      case 2:
        return <DetailsStep />;
      case 3:
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
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-28" />
              ))}
            </div>
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
              <div className="flex justify-center gap-2 pt-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "My Products", href: "/dashboard" },
                  {
                    label: "Product",
                    href: "/product",
                  },
                  {
                    label: "Features",
                    href: "/product/features",
                  },
                  {
                    label: isEditMode ? "Edit Feature" : "Create Feature",
                    href: "",
                    isCurrentPage: true,
                  },
                ]}
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isEditMode ? "Edit Your Feature" : "Create Your Feature"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update your feature details."
                : "Define a new feature for your product."}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepNames={["Select Product", "Feature Details", "Review"]}
            onStepClick={handleStepClick}
          />

          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-[90%]">
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

          <Card className="mb-8 max-w-[90%]">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Select Product"}
                {currentStep === 2 && "Feature Details"}
                {currentStep === 3 && "Review Your Feature"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Select the product for this feature."}
                {currentStep === 2 && "Provide details about your feature."}
                {currentStep === 3 &&
                  "Review your feature details before creating."}
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
                    {isEditMode ? "Update Feature" : "Create Feature"}
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
