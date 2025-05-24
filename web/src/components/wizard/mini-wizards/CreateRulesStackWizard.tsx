import React, { useState } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import MiniWizardBase, { MiniWizardProps } from "./MiniWizardBase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { rulesAtom, productAtom, selectedRulesAtom } from "@/lib/atoms/product";
import { firebaseRules } from "@/lib/firebase/client/FirebaseRules";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, X, ArrowRight } from "lucide-react";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import { Progress } from "@/components/ui/progress";

// Define the 7 rule categories for the rules wizard
const RULE_CATEGORIES = [
  {
    key: "designPrinciples" as const,
    name: "Design Principles",
    description: "Core design principles that guide your product's development",
    placeholder: "Add a design principle and press Enter",
    required: true,
    minItems: 2,
  },
  {
    key: "codingStandards" as const,
    name: "Coding Standards",
    description: "Standards for code quality and consistency",
    placeholder: "Add a coding standard and press Enter",
    required: true,
    minItems: 2,
  },
  {
    key: "brandGuidelines" as const,
    name: "Brand Guidelines",
    description: "Rules for maintaining brand consistency",
    placeholder: "Add a brand guideline and press Enter",
    required: true,
    minItems: 2,
  },
  {
    key: "accessibilityRequirements" as const,
    name: "Accessibility Requirements",
    description: "Requirements to ensure accessibility for all users",
    placeholder: "Add an accessibility requirement and press Enter",
    required: true,
    minItems: 2,
  },
  {
    key: "performanceRequirements" as const,
    name: "Performance Requirements",
    description: "Performance benchmarks and requirements",
    placeholder: "Add a performance requirement and press Enter",
    required: false,
    minItems: 0,
  },
  {
    key: "complianceRules" as const,
    name: "Compliance Rules",
    description: "Rules for regulatory and legal compliance",
    placeholder: "Add a compliance rule and press Enter",
    required: false,
    minItems: 0,
  },
  {
    key: "qualityAssuranceProcesses" as const,
    name: "Quality Assurance Processes",
    description: "Processes to ensure product quality",
    placeholder: "Add a quality assurance process and press Enter",
    required: false,
    minItems: 0,
  },
] as const;

// Form schema
const rulesSchema = z.object({
  designPrinciples: z.array(z.string()).min(2, {
    message: "Add at least two design principles.",
  }),
  codingStandards: z.array(z.string()).min(2, {
    message: "Add at least two coding standards.",
  }),
  brandGuidelines: z.array(z.string()).min(2, {
    message: "Add at least two brand guidelines.",
  }),
  accessibilityRequirements: z.array(z.string()).min(2, {
    message: "Add at least two accessibility requirements.",
  }),
  performanceRequirements: z.array(z.string()).optional(),
  complianceRules: z.array(z.string()).optional(),
  qualityAssuranceProcesses: z.array(z.string()).optional(),
});

type RulesFormValues = z.infer<typeof rulesSchema>;

export default function CreateRulesStackWizard({
  onBack,
  onComplete,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
>) {
  const [user] = useAuthState(clientAuth);
  const { toast } = useToast();
  const [product] = useAtom(productAtom);
  const [rules, setRules] = useAtom(rulesAtom);
  const [selectedRules, setSelectedRules] = useAtom(selectedRulesAtom);
  const [globalStep] = useAtom(globalWizardStepAtom);

  // Get current step from global state (rules is mainStep 5, so subStep is the current step)
  const [mainStep, subStep] = globalStep;
  const currentStep = mainStep === 5 ? subStep : 1; // Only show content if we're in rules wizard

  // Validate step range
  const validatedStep = Math.max(1, Math.min(7, currentStep));
  const currentCategory = RULE_CATEGORIES[validatedStep - 1];

  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for new items for each category
  const [newItems, setNewItems] = useState<Record<string, string>>({
    designPrinciples: "",
    codingStandards: "",
    brandGuidelines: "",
    accessibilityRequirements: "",
    performanceRequirements: "",
    complianceRules: "",
    qualityAssuranceProcesses: "",
  });

  // Initialize form with default values or existing rules data
  const form = useForm<RulesFormValues>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      designPrinciples:
        selectedRules?.designPrinciples || rules?.designPrinciples || [],
      codingStandards:
        selectedRules?.codingStandards || rules?.codingStandards || [],
      brandGuidelines:
        selectedRules?.brandGuidelines || rules?.brandGuidelines || [],
      accessibilityRequirements:
        selectedRules?.accessibilityRequirements ||
        rules?.accessibilityRequirements ||
        [],
      performanceRequirements:
        selectedRules?.performanceRequirements ||
        rules?.performanceRequirements ||
        [],
      complianceRules:
        selectedRules?.complianceRules || rules?.complianceRules || [],
      qualityAssuranceProcesses:
        selectedRules?.qualityAssuranceProcesses ||
        rules?.qualityAssuranceProcesses ||
        [],
    },
    mode: "onChange",
  });

  // Populate form when selectedRules changes (for edit mode)
  React.useEffect(() => {
    if (selectedRules && selectedRules.id) {
      console.log(
        "[CreateRulesStackWizard] Populating form from selectedRules:",
        selectedRules
      );
      form.reset({
        designPrinciples: selectedRules.designPrinciples || [],
        codingStandards: selectedRules.codingStandards || [],
        brandGuidelines: selectedRules.brandGuidelines || [],
        accessibilityRequirements:
          selectedRules.accessibilityRequirements || [],
        performanceRequirements: selectedRules.performanceRequirements || [],
        complianceRules: selectedRules.complianceRules || [],
        qualityAssuranceProcesses:
          selectedRules.qualityAssuranceProcesses || [],
      });
    }
  }, [selectedRules, form]);

  // Generic function to add an item to an array field
  const addItem = (fieldName: keyof RulesFormValues, newItem: string) => {
    if (newItem.trim() === "") return;

    console.log(
      `[CreateRulesStackWizard] Adding ${fieldName} item: ${newItem}`
    );
    const currentItems = (form.getValues(fieldName) as string[]) || [];
    form.setValue(fieldName, [...currentItems, newItem] as any);
    setNewItems((prev) => ({ ...prev, [fieldName]: "" }));
  };

  // Handle Enter key press to add items
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    fieldName: keyof RulesFormValues
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(fieldName, newItems[fieldName]);
    }
  };

  // Generic function to remove an item from an array field
  const removeItem = (fieldName: keyof RulesFormValues, index: number) => {
    console.log(
      `[CreateRulesStackWizard] Removing ${fieldName} item at index ${index}`
    );
    const currentItems = (form.getValues(fieldName) as string[]) || [];
    const updatedItems = [...currentItems];
    updatedItems.splice(index, 1);
    form.setValue(fieldName, updatedItems as any);
  };

  // Handle final submission
  const handleFinalSubmit = React.useCallback(async () => {
    const values = form.getValues();
    console.log("[CreateRulesStackWizard] Submitting rules form:", values);

    setIsSubmitting(true);

    try {
      if (!user) {
        console.error("[CreateRulesStackWizard] No user found");
        throw new Error("You must be logged in to create rules");
      }

      console.log("[CreateRulesStackWizard] User found:", user.uid);

      // Create rules data object
      const rulesData = {
        ...values,
        productId: product?.id || "",
        userId: user.uid,
      };

      let result;
      let isUpdate = false;

      // Check if we already have selected rules (update vs create)
      if (selectedRules && selectedRules.id) {
        console.log(
          "[CreateRulesStackWizard] Rules already exist, updating:",
          selectedRules.id
        );

        // Update existing rules
        result = await firebaseRules.updateRulesStack({
          ...rulesData,
          id: selectedRules.id,
        });
        isUpdate = true;
        console.log("[CreateRulesStackWizard] Firebase update result:", result);
      } else {
        // Create new rules
        console.log(
          "[CreateRulesStackWizard] Creating new rules with data:",
          rulesData
        );
        result = await firebaseRules.createRulesStack(rulesData);
        console.log("[CreateRulesStackWizard] Firebase create result:", result);
      }

      if (!result || !result.id) {
        console.error(
          "[CreateRulesStackWizard] Firebase operation failed:",
          result
        );
        throw new Error(
          `Failed to ${isUpdate ? "update" : "create"} rules stack`
        );
      }

      console.log(
        `[CreateRulesStackWizard] Rules ${isUpdate ? "updated" : "created"} successfully`
      );

      // Update local state with the returned rules data
      setRules(result);
      // Set the selected rules atom for wizard flow
      setSelectedRules(result);

      // Show success toast
      console.log("[CreateRulesStackWizard] Showing success toast");
      toast({
        title: isUpdate ? "Rules Updated" : "Rules Created",
        description: `Your rules have been successfully ${isUpdate ? "updated" : "created"}.`,
        duration: 3000,
      });

      // CRITICAL: Call onComplete to trigger the celebration
      console.log(
        "[CreateRulesStackWizard] Calling onComplete to trigger celebration"
      );
      if (onComplete) {
        onComplete(values);
      }
    } catch (error) {
      console.error(
        "[CreateRulesStackWizard] Error creating/updating rules:",
        error
      );
      const isUpdate = selectedRules && selectedRules.id;
      toast({
        title: "Error",
        description: `Failed to ${isUpdate ? "update" : "create"} rules. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form,
    user,
    product?.id,
    selectedRules,
    setRules,
    setSelectedRules,
    toast,
    onComplete,
  ]);

  // Expose navigation functions to parent component
  React.useEffect(() => {
    const wizard = {
      handleFinalSubmit,
      canGoNext: () => {
        // Check if current step meets minimum requirements
        const currentItems =
          (form.getValues(currentCategory.key) as string[]) || [];
        if (
          currentCategory.required &&
          currentItems.length < currentCategory.minItems
        ) {
          return false;
        }
        return true;
      },
      isLastStep: () => validatedStep === 7,
    };

    // Store wizard functions globally so MainWizard can access them
    (window as any).currentRulesWizard = wizard; // TODO: Fix typing
  }, [validatedStep, form, currentCategory, handleFinalSubmit]);

  // Calculate progress
  const getCurrentStepProgress = () => {
    const currentItems =
      (form.getValues(currentCategory.key) as string[]) || [];
    if (currentCategory.required) {
      return Math.min(
        (currentItems.length / currentCategory.minItems) * 100,
        100
      );
    } else {
      // For optional categories, show 100% if any items are added, 0% if none
      return currentItems.length > 0 ? 100 : 0;
    }
  };

  const getOverallProgress = () => {
    let completedSteps = 0;
    RULE_CATEGORIES.forEach((category) => {
      const items = (form.getValues(category.key) as string[]) || [];
      if (category.required) {
        if (items.length >= category.minItems) completedSteps++;
      } else {
        if (items.length > 0) completedSteps++;
      }
    });
    return (completedSteps / 7) * 100;
  };

  const currentStepItems =
    (form.getValues(currentCategory.key) as string[]) || [];

  // Don't render if we're not in the rules wizard (mainStep 5)
  if (mainStep !== 5) {
    return null;
  }

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.CREATE_RULES_STACK}
      title="Create Rules Stack"
      description="Define rules and constraints for your product to help AI understand the boundaries and requirements."
      xpReward={50}
      onBack={onBack}
      onComplete={onComplete}
    >
      <div className="space-y-6 px-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {RULE_CATEGORIES.map((category, index) => (
              <div key={category.key} className="flex items-center">
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
                {index < RULE_CATEGORIES.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Step {validatedStep}: {currentCategory.name}
            {currentCategory.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentCategory.description}
            {currentCategory.required &&
              ` (minimum ${currentCategory.minItems} required)`}
          </p>
        </div>

        {/* Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step Progress</span>
              <span>
                {currentStepItems.length}
                {currentCategory.required
                  ? `/${currentCategory.minItems}`
                  : ""}{" "}
                rules
              </span>
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

        {/* Current step form */}
        <Form {...form}>
          <FormField
            key={`form-field-${currentCategory.key}-${validatedStep}`}
            control={form.control}
            name={currentCategory.key}
            render={({ field: _field }) => {
              // Get the current field's actual value directly from form state
              const currentFieldValue =
                (form.getValues(currentCategory.key) as string[]) || [];

              return (
                <FormItem>
                  <FormLabel>{currentCategory.name}</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder={currentCategory.placeholder}
                      value={newItems[currentCategory.key]}
                      onChange={(e) =>
                        setNewItems((prev) => ({
                          ...prev,
                          [currentCategory.key]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => handleKeyPress(e, currentCategory.key)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        addItem(
                          currentCategory.key,
                          newItems[currentCategory.key]
                        )
                      }
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentFieldValue.map((item: string, index: number) => (
                      <Badge
                        key={`badge-${currentCategory.key}-${index}-${item.slice(0, 10)}`}
                        variant="secondary"
                        className="gap-1 py-1 px-3"
                      >
                        {item}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem(currentCategory.key, index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    {currentCategory.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </Form>

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
                ? `${currentCategory.name} complete!`
                : currentCategory.required
                  ? `Add ${currentCategory.minItems - currentStepItems.length} more ${currentCategory.name.toLowerCase()}`
                  : `${currentCategory.name} ready! Add items as needed.`}
            </span>
          </div>
        </div>

        {/* Final submission button for last step */}
        {validatedStep === 7 && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? "Creating Rules..."
                : selectedRules && selectedRules.id
                  ? "Update Rules"
                  : "Complete Rules Wizard"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete the rules wizard and continue to the next step.
            </p>
          </div>
        )}
      </div>
    </MiniWizardBase>
  );
}
