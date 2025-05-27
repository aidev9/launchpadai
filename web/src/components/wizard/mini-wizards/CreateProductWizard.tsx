import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import { Phases, type Product } from "@/lib/firebase/schema";
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
import { productAtom, selectedProductAtom } from "@/lib/store/product-store";
import { useToast } from "@/components/ui/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { PHASES } from "@/app/(protected)/myproducts/components/phase-filter";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import { Progress } from "@/components/ui/progress";

// Define the 3 steps for the product wizard
const PRODUCT_STEPS = [
  {
    name: "Product Basics",
    description: "Define your product name and description",
    required: true,
  },
  {
    name: "Development Details",
    description: "Set development phase and problem statement",
    required: false,
  },
  {
    name: "Additional Details",
    description: "Add team, website, and location information",
    required: false,
  },
] as const;

// Step 1 Schema: Basic Information
const stepOneSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(3, "Product name must be at least 3 characters"),
  description: z
    .string()
    .min(1, "Product description is required")
    .min(10, "Description should be at least 10 characters long"),
  phases: z.array(z.string()).optional(),
});

// Step 2 Schema: Problem Statement
const stepTwoSchema = z.object({
  problem: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message:
        "Problem statement should be at least 10 characters long if provided",
    }),
});

// Step 3 Schema: Additional Details
const stepThreeSchema = z.object({
  team: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: "Team name should be at least 2 characters long if provided",
    }),
  website: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
      {
        message: "Website must start with http:// or https://",
      }
    ),
  country: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: "Country name should be at least 2 characters long if provided",
    }),
});

// Combined Schema for all steps
const productFormSchema = z.object({
  ...stepOneSchema.shape,
  ...stepTwoSchema.shape,
  ...stepThreeSchema.shape,
  template_id: z.string().optional(),
  template_type: z.enum(["app", "agent", "integration", "blank"]).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function CreateProductWizard({
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
  const [user, loading, error] = useAuthState(clientAuth);
  const { toast } = useToast();
  const lastToastRef = React.useRef<{ step: number; type: string } | null>(
    null
  );
  const [product, setProduct] = useAtom(productAtom);
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [globalStep] = useAtom(globalWizardStepAtom);
  const [internalStep, setInternalStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Get current step from global state if we're in product wizard (mainStep 1)
  const [mainStep, subStep] = globalStep;
  const currentStep =
    mainStep === 1 ? subStep : (externalCurrentStep ?? internalStep);

  // Don't render step indicator if we're not in the product wizard (mainStep 1) and no external step is provided
  const showStepIndicator = mainStep === 1 || externalCurrentStep !== undefined;

  // Validate step range
  const validatedStep = Math.max(1, Math.min(3, currentStep));
  const currentStepInfo = PRODUCT_STEPS[validatedStep - 1];

  // Initialize form with default values or existing product data
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      phases: product?.phases || [],
      problem: product?.problem || "",
      team: product?.team || "",
      website: product?.website || "",
      country: product?.country || "US",
      template_id: product?.template_id || "",
      template_type:
        (product?.template_type as
          | "app"
          | "agent"
          | "integration"
          | "blank"
          | undefined) || "blank",
    },
    mode: "onChange",
  });

  // Watch form changes to trigger validation updates
  const formValues = form.watch();

  // Navigate to next step
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

  // Navigate to previous step
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
    if (externalCurrentStep !== undefined || mainStep === 1) {
      // Parent is controlling the steps, expose our navigation functions
      const wizard = {
        submitForm: async () => {
          console.log(
            "[CreateProductWizard] submitForm called externally (e.g., by MainWizard's Next button)."
          );
          // Trigger validation for ALL fields in the productFormSchema
          const isEntireFormValid = await form.trigger();

          if (isEntireFormValid) {
            console.log(
              "[CreateProductWizard] Entire form is valid. Proceeding with submission."
            );
            // If the entire form is valid, call the main onSubmit handler
            // which will save the product and call onComplete.
            await onSubmit(form.getValues());
            return { success: true };
          } else {
            console.log(
              "[CreateProductWizard] Form validation failed. Errors should be displayed by react-hook-form."
            );
            // react-hook-form will display specific field errors via <FormMessage />
            // MainWizard will show a generic toast.
            return {
              success: false,
              message: "Please correct the errors shown on the form.",
            };
          }
        },
        goToNextStep,
        goToPreviousStep,
        handleFinalSubmit,
        canGoNext: () => {
          if (validatedStep === 1) {
            const hasName = !!form.getValues().name;
            const hasDescription = !!form.getValues().description;
            if (!hasName || !hasDescription) {
              // if (!lastToastRef.current || lastToastRef.current.step !== 1 || lastToastRef.current.type !== "missing-basics") {
              //   toast({
              //     title: "Validation Error",
              //     description: "Product name and description are required to continue.",
              //     variant: "destructive",
              //   });
              //   lastToastRef.current = { step: 1, type: "missing-basics" };
              // }
              return false;
            } else {
              lastToastRef.current = null;
            }
            return true;
          }
          if (validatedStep === 2) {
            lastToastRef.current = null;
            return true; // Step 2 is optional
          }
          if (validatedStep === 3) {
            const isValid = form.formState.isValid;
            if (!isValid) {
              if (
                !lastToastRef.current ||
                lastToastRef.current.step !== 3 ||
                lastToastRef.current.type !== "invalid-form"
              ) {
                toast({
                  title: "Validation Error",
                  description: "Please fix the form errors before continuing.",
                  variant: "destructive",
                });
                lastToastRef.current = { step: 3, type: "invalid-form" };
              }
              return false;
            } else {
              lastToastRef.current = null;
            }
            return true;
          }
          lastToastRef.current = null;
          return false;
        },
        canGoBack: () => validatedStep > 1,
        isLastStep: () => validatedStep === 3,
      };

      // Store wizard functions globally so MainWizard can access them
      (window as any).currentProductWizard = wizard;
    }
  }, [
    validatedStep,
    form,
    onStepChange,
    formValues,
    externalCurrentStep,
    mainStep,
  ]);

  // Calculate progress
  const getCurrentStepProgress = () => {
    switch (validatedStep) {
      case 1: // Product Basics
        const hasName = !!form.getValues().name;
        const hasDescription = !!form.getValues().description;
        if (hasName && hasDescription) return 100;
        if (hasName) return 50;
        return 0;
      case 2: // Development Details
        const hasPhases = (form.getValues().phases || []).length > 0;
        const hasProblem = !!form.getValues().problem;
        if (hasPhases && hasProblem) return 100;
        if (hasPhases || hasProblem) return 50;
        return 0;
      case 3: // Additional Details
        const hasTeam = !!form.getValues().team;
        const hasWebsite = !!form.getValues().website;
        const hasCountry = !!form.getValues().country;
        let completedFields = 0;
        if (hasTeam) completedFields++;
        if (hasWebsite) completedFields++;
        if (hasCountry) completedFields++;
        return (completedFields / 3) * 100;
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

  // Handle form submission and save to Firebase
  async function onSubmit(values: ProductFormValues) {
    console.log("[CreateProductWizard] Starting onSubmit with values:", values);

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (!user) {
        console.error("[CreateProductWizard] No user found");
        throw new Error("You must be logged in to create a product");
      }

      console.log("[CreateProductWizard] User found:", user.uid);

      // Convert string phases to Phases enum values
      const phasesEnum = (values.phases || []).map((phase) => {
        return phase as unknown as Phases;
      });

      // Create product data object
      const productData = {
        name: values.name,
        description: values.description || "",
        phases: phasesEnum,
        problem: values.problem || "",
        team: values.team || "",
        website: values.website || "",
        country: values.country || "US",
        template_id: values.template_id || "",
        template_type: values.template_type || "blank",
      };

      let result;
      let isUpdate = false;

      // Check if we already have a selected product (update vs create)
      if (selectedProduct && selectedProduct.id) {
        console.log(
          "[CreateProductWizard] Product already exists, updating:",
          selectedProduct.id
        );

        // Update existing product
        result = await firebaseProducts.updateProduct(
          selectedProduct.id,
          productData
        );
        isUpdate = true;
        console.log("[CreateProductWizard] Firebase update result:", result);
      } else {
        // Create new product
        console.log(
          "[CreateProductWizard] Creating new product with data:",
          productData
        );
        result = await firebaseProducts.createProduct(productData);
        console.log("[CreateProductWizard] Firebase create result:", result);
      }

      if (!result || !result.success) {
        console.error(
          "[CreateProductWizard] Firebase operation failed:",
          result?.error
        );
        throw new Error(
          result?.error || `Failed to ${isUpdate ? "update" : "create"} product`
        );
      }

      console.log(
        `[CreateProductWizard] Product ${isUpdate ? "updated" : "created"} successfully`
      );

      // Update local state with the returned product data
      if (result.data) {
        console.log("[CreateProductWizard] Updating local product state");
        // Convert the result data to match the Product type from schema.ts
        const productData = {
          id: result.data.id || selectedProduct?.id || "",
          name: result.data.name,
          description: result.data.description || "",
          phases: result.data.phases || [],
          problem: result.data.problem,
          team: result.data.team,
          website: result.data.website,
          country: result.data.country,
          template_id: result.data.template_id,
          template_type: result.data.template_type as
            | "app"
            | "agent"
            | "integration"
            | "blank"
            | undefined,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        };

        setProduct(productData);
        // Set the selected product atom for wizard flow
        setSelectedProduct(productData);
      }

      // Show success toast
      console.log("[CreateProductWizard] Showing success toast");
      toast({
        title: isUpdate ? "Product Updated" : "Product Created",
        description: `Your product has been successfully ${isUpdate ? "updated" : "created"}.`,
        duration: 3000,
      });

      // CRITICAL: Make sure we're not in an error or loading state before calling onComplete
      setIsSubmitting(false);
      setFormError(null);

      // CRITICAL: Call onComplete to trigger the celebration
      console.log(
        "[CreateProductWizard] Calling onComplete to trigger celebration"
      );
      if (onComplete) {
        onComplete(values);
      }
    } catch (error) {
      console.error(
        "[CreateProductWizard] Error creating/updating product:",
        error
      );
      setFormError(
        error instanceof Error ? error.message : "An error occurred"
      );
      const isUpdate = selectedProduct && selectedProduct.id;
      if (
        !lastToastRef.current ||
        lastToastRef.current.type !== "submit-error"
      ) {
        toast({
          title: "Error",
          description: `Failed to ${isUpdate ? "update" : "create"} product. Please try again.`,
          variant: "destructive",
        });
        lastToastRef.current = { step: validatedStep, type: "submit-error" };
      }
      setIsSubmitting(false);
    }
  }

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.CREATE_PRODUCT}
      title="Create Your Product"
      description="Define your product for AI generation. The more details you provide, the better the results will be."
      xpReward={50}
      onBack={onBack}
      onComplete={onComplete}
    >
      <div className="space-y-6 px-4">
        {/* Step indicator - only show if in wizard mode */}
        {showStepIndicator && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {PRODUCT_STEPS.map((step, index) => (
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
                  {index < PRODUCT_STEPS.length - 1 && (
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
              {currentStepInfo.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Product Name and Description */}
            {validatedStep === 1 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 1: Product Basics
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Product Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your product name"
                          {...field}
                          data-testid="product-name-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Description <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what your product does"
                          className="min-h-[80px]"
                          {...field}
                          data-testid="product-description-input"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a clear description of your product's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Development Phase and Problem Statement */}
            {validatedStep === 2 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 2: Development Details
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="phases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Development Phase</FormLabel>
                      <FormControl>
                        <MultiSelect
                          placeholder="Select phases"
                          options={PHASES.filter(
                            (phase) => phase !== "All"
                          ).map((phase) => ({
                            label: phase,
                            value: phase,
                          }))}
                          selected={field.value || []}
                          onChange={field.onChange}
                          data-testid="product-phases-select"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Statement</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What problem does your product solve?"
                          className="min-h-[80px]"
                          {...field}
                          data-testid="product-problem-input"
                        />
                      </FormControl>
                      <FormDescription>
                        Clearly define the problem your product addresses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Additional Details */}
            {validatedStep === 3 && (
              <div className="space-y-4">
                {!showStepIndicator && (
                  <h3 className="text-lg font-medium">
                    Step 3: Additional Details
                  </h3>
                )}
                <FormField
                  control={form.control}
                  name="team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your team name or description"
                          {...field}
                          data-testid="product-team-input"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Describe your team or organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          data-testid="product-website-input"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Your product or company website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your country"
                          {...field}
                          data-testid="product-country-input"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Where is your product being developed?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Display any form errors */}
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{formError}</p>
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
        {/* {showStepIndicator && validatedStep === 3 && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? "Creating Product..."
                : "Complete Product Creation"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete the product wizard and continue to the next step.
            </p>
          </div>
        )} */}
      </div>
    </MiniWizardBase>
  );
}
