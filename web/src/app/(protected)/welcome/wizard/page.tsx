"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { allTemplates, Template } from "../data/templates";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { firebaseProducts } from "@/lib/firebase/client/FirebaseProducts";
import {
  editedProductAtom,
  selectedProductAtom,
  productsAtom,
  addProductAtom,
  updateProductAtom,
} from "@/lib/store/product-store";
import { Product, Phases } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { CountrySelect } from "@/components/ui/country-select";
import { useXpMutation } from "@/xp/useXpMutation";
import SkeletonForm from "@/components/layout/skeletonForm";
import { useEffect, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { PHASES } from "@/app/(protected)/myproducts/components/phase-filter";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Step 1 Schema: Basic Information
const stepOneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  phases: z.array(z.string()).optional(),
});

// Step 2 Schema: Problem Statement
const stepTwoSchema = z.object({
  problem: z.string().optional(),
});

// Step 3 Schema: Additional Details
const stepThreeSchema = z.object({
  team: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
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

// Type for creating a product (without id, createdAt, updatedAt)
type ProductCreateInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

// Define the props for the wizard component

export default function Wizard() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(clientAuth);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use Jotai to sync with global state
  const [editedProduct] = useAtom(editedProductAtom);
  const [, setSelectedProduct] = useAtom(selectedProductAtom);
  const [products, setProducts] = useAtom(productsAtom);
  const addProduct = useAtom(addProductAtom)[1];
  const updateProductInAtom = useAtom(updateProductAtom)[1];

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Initialize form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      phases: [],
      problem: "",
      team: "",
      website: "",
      country: "US",
      template_id: "",
      template_type: "blank",
    },
  });

  // Update form values when editedProduct changes
  useEffect(() => {
    if (editedProduct) {
      // Reset form with edited product values
      form.reset({
        name: editedProduct.name || "",
        description: editedProduct.description || "",
        problem: editedProduct.problem || "",
        team: editedProduct.team || "",
        website: editedProduct.website || "",
        country: editedProduct.country || "US",
        template_id: editedProduct.template_id || "",
        template_type:
          (editedProduct.template_type as
            | "app"
            | "agent"
            | "integration"
            | "blank") || "blank",
        phases: editedProduct.phases || [],
      });

      // If it has a template, set it
      if (editedProduct.template_id && editedProduct.template_id !== "blank") {
        const template = allTemplates.find(
          (t) => t.id === editedProduct.template_id
        );
        if (template) {
          setSelectedTemplate(template);
        }
      }
    }
  }, [editedProduct, form]);

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const productData = {
        name: data.name,
        description: data.description,
        phases: data.phases?.map((phase) => phase as Phases) || [],
        problem: data.problem,
        team: data.team,
        website: data.website,
        country: data.country,
        template_id: data.template_id,
        template_type: data.template_type as
          | "app"
          | "agent"
          | "integration"
          | "blank"
          | undefined,
      };

      console.log(
        "[Wizard] About to create/update product with data:",
        productData
      );
      console.log("[Wizard] User authentication state:", {
        user: !!user,
        authLoading,
      });

      if (!user) {
        console.error("[Wizard] User not authenticated");
        setFormError("User not authenticated. Please sign in and try again.");
        toast({
          title: "Authentication Error",
          description: "User not authenticated. Please sign in and try again.",
          duration: TOAST_DEFAULT_DURATION,
          variant: "destructive",
        });
        return;
      }

      let result;

      if (editedProduct) {
        console.log("[Wizard] Updating existing product:", editedProduct.id);
        result = await firebaseProducts.updateProduct(
          editedProduct.id,
          productData
        );
      } else {
        console.log("[Wizard] Creating new product");
        result = await firebaseProducts.createProduct(productData);
      }

      console.log("[Wizard] Firebase operation result:", result);

      if (!result) {
        console.error("[Wizard] Firebase operation returned undefined");
        setFormError("Firebase operation failed - no response received");
        toast({
          title: "Error saving product",
          description: "Firebase operation failed - no response received",
          duration: TOAST_DEFAULT_DURATION,
          variant: "destructive",
        });
        return;
      }

      if (result.success) {
        if (result.data) {
          const updatedProduct = result.data as Product;

          // Set the product in the selectedProductAtom
          setSelectedProduct(updatedProduct);

          if (!editedProduct) {
            // Award XP for creating a new product
            const createProductActionId = "create_product";
            xpMutation.mutate(createProductActionId);

            // Also add the product to the productsAtom
            addProduct(updatedProduct);

            // Navigate to the product page
            router.push("/myproducts/product");

            toast({
              title: "Success",
              description: "Product created successfully!",
              duration: TOAST_DEFAULT_DURATION,
            });
          } else {
            // For edits, update the product in both atoms
            setSelectedProduct(updatedProduct);
            updateProductInAtom(updatedProduct);

            // Show a success message
            toast({
              title: "Success",
              description: "Product updated successfully!",
              duration: TOAST_DEFAULT_DURATION,
            });

            // Use the onComplete callback if provided
            router.push("/myproducts/product");

            setIsSubmitting(false);
          }
        }
      } else {
        const errorMessage =
          result?.error || "Failed to save product. Please try again.";
        console.error("[Wizard] Product save failed:", errorMessage);
        setFormError(errorMessage);
        toast({
          title: "Error saving product",
          description: errorMessage,
          duration: TOAST_DEFAULT_DURATION,
          variant: "destructive",
        });
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to next step
  const goToNextStep = async () => {
    if (currentStep === 1) {
      const result = await form.trigger(["name", "description"]);
      if (!result) return;
    } else if (currentStep === 2) {
      const result = await form.trigger(["problem"]);
      if (!result) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    // Validate all fields before submitting
    const isValid = await form.trigger();

    if (isValid) {
      await form.handleSubmit(onSubmit)();
    }
  };

  // Problem suggestions
  const problemSuggestions = [
    "I need a marketing landing page to attract customers",
    "I need to conduct market research to validate my idea",
    "I need to build an MVP to test with early users",
    "I need to automate customer support for my business",
    "I need to integrate AI capabilities into my existing product",
  ];

  // Loading state
  if (isLoading) {
    return <SkeletonForm />;
  }

  return (
    <div className="w-3/4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center w-full">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
          </div>
          <div
            className={`flex-1 h-1 ${currentStep > 1 ? "bg-primary" : "bg-muted"}`}
          ></div>
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {currentStep > 2 ? <Check className="h-5 w-5" /> : "2"}
          </div>
          <div
            className={`flex-1 h-1 ${currentStep > 2 ? "bg-primary" : "bg-muted"}`}
          ></div>
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {currentStep > 3 ? <Check className="h-5 w-5" /> : "3"}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-8"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="space-y-4 mt-4">
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe your product"
                          {...field}
                          data-testid="product-description-input"
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Phase(s)</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={Object.values(PHASES)
                            .filter((phase) => phase !== "All")
                            .map((phase) => ({ label: phase, value: phase }))}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Select product phases..."
                          data-testid="product-phases-select"
                        />
                      </FormControl>
                      <FormDescription>
                        Select one or more phases for your product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  type="button"
                  onClick={goToNextStep}
                  data-testid="next-step-button"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Problem Statement */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Problem Statement</CardTitle>
                <CardDescription>
                  What problem are you trying to solve?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the problem you're solving"
                          {...field}
                          data-testid="product-problem-input"
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  data-testid="previous-step-button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  onClick={goToNextStep}
                  data-testid="next-step-button"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Tell us more about your team and project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Members</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Who's working on this project?"
                          {...field}
                          data-testid="product-team-input"
                        />
                      </FormControl>
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
                          placeholder="Your product's website (if any)"
                          {...field}
                          data-testid="product-website-input"
                        />
                      </FormControl>
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
                        <CountrySelect
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  data-testid="previous-step-button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  data-testid="submit-button"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editedProduct
                      ? "Update Product"
                      : "Create Product"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {formError && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mt-4">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 text-green-800 p-4 rounded-md mt-4">
              {successMessage}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
