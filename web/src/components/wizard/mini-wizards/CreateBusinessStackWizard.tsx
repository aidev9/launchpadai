import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import MiniWizardBase, { MiniWizardProps } from "./MiniWizardBase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  businessStackAtom,
  productAtom,
  selectedBusinessStackAtom,
} from "@/lib/store/product-store";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, X, ArrowRight } from "lucide-react";
import { firebaseBusinessStacks } from "@/lib/firebase/client/FirebaseBusinessStacks";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { toast } from "@/components/ui/use-toast";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import { Progress } from "@/components/ui/progress";

// Define the 3 steps for the business stack wizard
const BUSINESS_STACK_STEPS = [
  {
    name: "Market & Revenue",
    description: "Define market size and revenue model",
    required: false,
  },
  {
    name: "Distribution & Acquisition",
    description: "Set distribution channels and customer acquisition strategy",
    required: false,
  },
  {
    name: "Value & Strategy",
    description: "Define value proposition, cost structure, and partnerships",
    required: false,
  },
] as const;

// Business Stack Schema - making all fields optional
const businessStackSchema = z.object({
  marketSize: z.string().optional(),
  revenueModel: z.string().optional(),
  distributionChannels: z.array(z.string()).optional(),
  partnerships: z.array(z.string()).optional(),
  customerAcquisition: z.string().optional(),
  valueProposition: z.string().optional(),
  costStructure: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type BusinessStackFormValues = z.infer<typeof businessStackSchema>;

export default function CreateBusinessStackWizard({
  onBack,
  onComplete,
  currentStep: externalCurrentStep,
  onStepChange,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
> & {
  currentStep?: number;
  onStepChange?: (step: number) => void;
}) {
  const [product] = useAtom(productAtom);
  const [businessStack, setBusinessStack] = useAtom(businessStackAtom);
  const [selectedBusinessStack, setSelectedBusinessStack] = useAtom(
    selectedBusinessStackAtom
  );
  const [globalStep] = useAtom(globalWizardStepAtom);
  const [user] = useAuthState(clientAuth);
  const [internalStep, setInternalStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);
  const [newChannel, setNewChannel] = useState("");
  const [newPartnership, setNewPartnership] = useState("");
  const [newTag, setNewTag] = useState("");

  // Get current step from global state if we're in business stack wizard (mainStep 2)
  const [mainStep, subStep] = globalStep;
  const currentStep =
    mainStep === 2 ? subStep : (externalCurrentStep ?? internalStep);

  // Don't render step indicator if we're not in the business stack wizard (mainStep 2) and no external step is provided
  const showStepIndicator = mainStep === 2 || externalCurrentStep !== undefined;

  // Validate step range
  const validatedStep = Math.max(1, Math.min(3, currentStep));
  const currentStepInfo = BUSINESS_STACK_STEPS[validatedStep - 1];

  // Initialize form with default values or existing business stack data
  const form = useForm<BusinessStackFormValues>({
    resolver: zodResolver(businessStackSchema),
    defaultValues: {
      marketSize: businessStack?.marketSize || "",
      revenueModel: businessStack?.revenueModel || "",
      distributionChannels: businessStack?.distributionChannels || [],
      customerAcquisition: businessStack?.customerAcquisition || "",
      valueProposition: businessStack?.valueProposition || "",
      costStructure: businessStack?.costStructure || "",
      partnerships: businessStack?.partnerships || [],
      tags: businessStack?.tags || [],
    },
    mode: "onChange",
  });

  // Monitor form validity
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsFormValid(form.formState.isValid);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Navigation functions
  const goToNextStep = () => {
    if (validatedStep < 3) {
      const nextStep = validatedStep + 1;
      if (onStepChange) {
        onStepChange(nextStep);
      } else {
        setInternalStep(nextStep);
      }
    }
  };

  const goToPreviousStep = () => {
    if (validatedStep > 1) {
      const prevStep = validatedStep - 1;
      if (onStepChange) {
        onStepChange(prevStep);
      } else {
        setInternalStep(prevStep);
      }
    } else if (onBack) {
      onBack();
    }
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const values = form.getValues();
      await onSubmit(values);
    }
  };

  // Expose navigation functions to parent component
  React.useEffect(() => {
    if (externalCurrentStep !== undefined || mainStep === 2) {
      const wizard = {
        goToNextStep,
        goToPreviousStep,
        handleFinalSubmit,
        submitForm: async () => {
          const isValid = await form.trigger();
          if (isValid) {
            const values = form.getValues();
            onSubmit(values);
          }
        },
        canGoNext: () => {
          // All steps are optional
          return true;
        },
        canGoBack: () => validatedStep > 1,
        isLastStep: () => validatedStep === 3,
      };

      // Store wizard functions globally so MainWizard can access them
      (window as any).currentBusinessStackWizard = wizard;
    }
  }, [validatedStep, form, onStepChange, externalCurrentStep, mainStep]);

  // Calculate progress
  const getCurrentStepProgress = () => {
    switch (validatedStep) {
      case 1: // Market & Revenue
        const hasMarketSize = !!form.getValues().marketSize;
        const hasRevenueModel = !!form.getValues().revenueModel;
        let completedFields = 0;
        if (hasMarketSize) completedFields++;
        if (hasRevenueModel) completedFields++;
        return (completedFields / 2) * 100;
      case 2: // Distribution & Acquisition
        const hasChannels =
          (form.getValues().distributionChannels || []).length > 0;
        const hasCustomerAcq = !!form.getValues().customerAcquisition;
        if (hasChannels && hasCustomerAcq) return 100;
        if (hasChannels || hasCustomerAcq) return 50;
        return 0;
      case 3: // Value & Strategy
        const hasValueProp = !!form.getValues().valueProposition;
        const hasCostStructure = !!form.getValues().costStructure;
        const hasPartnerships =
          (form.getValues().partnerships || []).length > 0;
        const hasTags = (form.getValues().tags || []).length > 0;
        let completedFields3 = 0;
        if (hasValueProp) completedFields3++;
        if (hasCostStructure) completedFields3++;
        if (hasPartnerships) completedFields3++;
        if (hasTags) completedFields3++;
        return (completedFields3 / 4) * 100;
      default:
        return 0;
    }
  };

  const getOverallProgress = () => {
    let totalProgress = 0;
    for (let i = 1; i <= 3; i++) {
      if (i < validatedStep) {
        totalProgress += 100; // Completed steps
      } else if (i === validatedStep) {
        totalProgress += getCurrentStepProgress(); // Current step progress
      }
      // Future steps contribute 0
    }
    return totalProgress / 3; // Average across 3 steps
  };

  // Add distribution channel
  const addDistributionChannel = () => {
    if (newChannel.trim() === "") return;

    const currentChannels = form.getValues("distributionChannels") || [];
    form.setValue("distributionChannels", [...currentChannels, newChannel]);
    setNewChannel("");
  };

  // Remove distribution channel
  const removeDistributionChannel = (index: number) => {
    const currentChannels = form.getValues("distributionChannels") || [];
    const updatedChannels = [...currentChannels];
    updatedChannels.splice(index, 1);
    form.setValue("distributionChannels", updatedChannels);
  };

  // Add partnership
  const addPartnership = () => {
    if (newPartnership.trim() === "") return;

    const currentPartnerships = form.getValues("partnerships") || [];
    form.setValue("partnerships", [...currentPartnerships, newPartnership]);
    setNewPartnership("");
  };

  // Remove partnership
  const removePartnership = (index: number) => {
    const currentPartnerships = form.getValues("partnerships") || [];
    const updatedPartnerships = [...currentPartnerships];
    updatedPartnerships.splice(index, 1);
    form.setValue("partnerships", updatedPartnerships);
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() === "") return;

    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", [...currentTags, newTag]);
    setNewTag("");
  };

  // Remove tag
  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags") || [];
    const updatedTags = [...currentTags];
    updatedTags.splice(index, 1);
    form.setValue("tags", updatedTags);
  };

  // Handle Enter key press for inputs
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    action: () => void
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  // Update business stack atom on valid submission
  async function onSubmit(values: BusinessStackFormValues) {
    console.log(
      "[CreateBusinessStackWizard] Submitting business stack form:",
      values
    );

    try {
      // Create business stack data for Firebase
      const businessStackData = {
        productId: product?.id || "",
        marketSize: values.marketSize || "",
        revenueModel: values.revenueModel || "",
        distributionChannels: values.distributionChannels || [],
        partnerships: values.partnerships || [],
        customerAcquisition: values.customerAcquisition || "",
        valueProposition: values.valueProposition || "",
        costStructure: values.costStructure || "",
        tags: values.tags || [],
      };

      let result;
      let isUpdate = false;

      // Check if we already have a selected business stack (update vs create)
      if (selectedBusinessStack && selectedBusinessStack.id) {
        console.log(
          "[CreateBusinessStackWizard] Business stack already exists, updating:",
          selectedBusinessStack.id
        );

        // Update existing business stack
        result = await firebaseBusinessStacks.updateBusinessStack({
          ...businessStackData,
          id: selectedBusinessStack.id,
        });
        isUpdate = true;
        console.log(
          "[CreateBusinessStackWizard] Firebase update result:",
          result
        );
      } else {
        // Create new business stack
        console.log(
          "[CreateBusinessStackWizard] Creating new business stack with data:",
          businessStackData
        );
        result =
          await firebaseBusinessStacks.createBusinessStack(businessStackData);
        console.log(
          "[CreateBusinessStackWizard] Firebase create result:",
          result
        );
      }

      if (result) {
        console.log(
          `[CreateBusinessStackWizard] Business stack ${isUpdate ? "updated" : "created"} in Firebase:`,
          result
        );

        // Update the business stack atom with the result from Firebase
        setBusinessStack(result);

        // Set the selected business stack atom for wizard flow
        setSelectedBusinessStack(result);

        // Show success toast
        toast({
          title: isUpdate ? "Business Stack Updated" : "Business Stack Created",
          description: `Your business stack has been successfully ${isUpdate ? "updated" : "created"}.`,
        });

        // CRITICAL: Call onComplete to trigger the celebration
        console.log(
          "[CreateBusinessStackWizard] Calling onComplete to trigger celebration"
        );
        if (onComplete) {
          onComplete(values);
        }
      } else {
        throw new Error(
          `Failed to ${isUpdate ? "update" : "create"} business stack`
        );
      }
    } catch (error) {
      console.error(
        "[CreateBusinessStackWizard] Error creating/updating business stack:",
        error
      );
      // Still update local state even if Firebase fails
      setBusinessStack({
        productId: product?.id,
        marketSize: values.marketSize || "",
        revenueModel: values.revenueModel || "",
        distributionChannels: values.distributionChannels || [],
        partnerships: values.partnerships || [],
        customerAcquisition: values.customerAcquisition || "",
        valueProposition: values.valueProposition || "",
        costStructure: values.costStructure || "",
        tags: values.tags || [],
      });

      // Still call onComplete even if Firebase persistence fails
      if (onComplete) {
        onComplete(values);
      }
    }
  }

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.CREATE_BUSINESS_STACK}
      title="Create Business Stack"
      description="Define the business aspects of your product to help AI understand your market strategy."
      xpReward={50}
      onBack={onBack}
      onComplete={onComplete}
    >
      <div className="space-y-6 px-4">
        {/* Step indicator - only show if in wizard mode */}
        {showStepIndicator && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {BUSINESS_STACK_STEPS.map((step, index) => (
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
                  {index < BUSINESS_STACK_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        {showStepIndicator && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Step {validatedStep}: {currentStepInfo.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStepInfo.description}
            </p>
          </div>
        )}

        {/* Progress - only show if in wizard mode */}
        {showStepIndicator && (
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
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Market & Revenue */}
            {validatedStep === 1 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 1: Market & Revenue
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="marketSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Size</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your target market size and potential"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How large is your target market? Include numbers if
                        available.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revenueModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue Model</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe how your product will generate revenue"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Subscription? One-time purchase? Freemium?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Distribution & Acquisition */}
            {validatedStep === 2 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 2: Distribution & Acquisition
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="distributionChannels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distribution Channels</FormLabel>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a distribution channel"
                          value={newChannel}
                          onChange={(e) => setNewChannel(e.target.value)}
                          onKeyDown={(e) =>
                            handleKeyPress(e, () => addDistributionChannel())
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addDistributionChannel}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((channel, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 py-1 px-3"
                          >
                            {channel}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeDistributionChannel(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        How will your product reach customers?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAcquisition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Acquisition</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your customer acquisition strategy"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How will you attract and convert new customers?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Value & Strategy */}
            {validatedStep === 3 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 3: Value & Strategy
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="valueProposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value Proposition</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What unique value does your product offer?"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Why should customers choose your product over
                        alternatives?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Structure (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your primary costs and expenses"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What are your main costs? Development, marketing,
                        operations?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnerships"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Partnerships (Optional)</FormLabel>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a partnership"
                          value={newPartnership}
                          onChange={(e) => setNewPartnership(e.target.value)}
                          onKeyDown={(e) =>
                            handleKeyPress(e, () => addPartnership())
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addPartnership}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((partnership, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 py-1 px-3"
                          >
                            {partnership}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removePartnership(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Which partners are crucial for your success?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a tag and press Enter"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, () => addTag())}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addTag}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value?.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 py-1 px-3"
                          >
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Add tags to categorize your business stack
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" className="hidden">
              Submit
            </Button>
          </form>
        </Form>

        {/* Step completion status */}
        {showStepIndicator && (
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
                  : `Complete the ${currentStepInfo.name.toLowerCase()} to continue.`}
              </span>
            </div>
          </div>
        )}

        {/* Final submission button for last step */}
        {showStepIndicator && validatedStep === 3 && (
          <div className="pt-4 border-t">
            <Button onClick={handleFinalSubmit} className="w-full">
              Complete Business Stack
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete the business stack wizard and continue to the next step.
            </p>
          </div>
        )}
      </div>
    </MiniWizardBase>
  );
}
