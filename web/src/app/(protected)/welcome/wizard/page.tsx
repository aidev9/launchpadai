"use client";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { allTemplates, Template } from "../data/templates";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ProductInput,
  createProduct,
  getProduct,
  updateProduct,
} from "@/lib/firebase/products";
import {
  Product,
  selectedProductAtom,
  selectedProductIdAtom,
} from "@/lib/store/product-store";
import { useAtom } from "jotai";
import { CountrySelect } from "@/components/ui/country-select";
import { set } from "nprogress";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Step 1 Schema: Basic Information
const stepOneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  stage: z.enum([
    "Discover",
    "Validate",
    "Design",
    "Build",
    "Secure",
    "Launch",
    "Grow",
  ]),
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

export default function ProductWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Use Jotai to sync with global state
  const [, setSelectedProduct] = useAtom(selectedProductAtom);
  const [, setSelectedProductId] = useAtom(selectedProductIdAtom);

  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const templateType = searchParams.get("type");
  const editProductId = searchParams.get("edit");

  // Initialize form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      stage: "Discover",
      problem: "",
      team: "",
      website: "",
      country: "US",
      template_id: templateId || "",
      template_type: (templateType as any) || "blank",
    },
  });

  // Check if we're in edit mode and load the product data
  useEffect(() => {
    const fetchProductToEdit = async () => {
      if (editProductId) {
        setIsLoading(true);
        setIsEditMode(true);

        try {
          const result = await getProduct(editProductId);
          if (result.success && result.product) {
            const productData = result.product as Product;
            setProductToEdit(productData);

            // Populate form with existing data
            form.reset({
              name: productData.name || "",
              description: productData.description || "",
              stage: productData.stage as any,
              problem: productData.problem || "",
              team: productData.team || "",
              website: productData.website || "",
              country: productData.country || "US",
              template_id: productData.template_id || "",
              template_type: (productData.template_type as any) || "blank",
            });

            // If it has a template, try to set the selected template
            if (
              productData.template_id &&
              productData.template_id !== "blank"
            ) {
              const template = allTemplates.find(
                (t) => t.id === productData.template_id
              );
              if (template) {
                setSelectedTemplate(template);
              }
            }
          } else {
            // Product not found - redirect to welcome page
            router.push("/welcome");
          }
        } catch (error) {
          console.error("Failed to fetch product for editing:", error);
          router.push("/welcome");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProductToEdit();
  }, [editProductId, form, router]);

  // Fetch template details if provided (for new products)
  useEffect(() => {
    if (!isEditMode && templateId && templateId !== "blank" && templateType) {
      const template = allTemplates.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        // Pre-fill some fields based on template
        form.setValue("name", template.name);
        form.setValue("description", `${template.description}`);
      }
    }
  }, [templateId, templateType, form, isEditMode]);

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const productData: ProductInput = {
        ...data,
      };

      let result;

      if (isEditMode && productToEdit) {
        // Update existing product
        result = await updateProduct(productToEdit.id, productData);
      } else {
        // Create new product
        result = await createProduct(productData);
      }

      if (result.success) {
        // Update global state with the new product
        if (result.data) {
          const updatedProduct = {
            id: result.id,
            ...result.data,
          } as Product;

          console.log("[Product Creation] Updated product:", updatedProduct);

          // Set product ID in localStorage first for better persistence
          localStorage.setItem("selectedProductId", result.id);

          // Then update the atoms
          setSelectedProductId(result.id);
          setSelectedProduct(updatedProduct);

          // Add a small delay before navigation to ensure state is updated
          // This is especially important for mobile browsers
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Use replace instead of push to avoid navigation history issues on mobile
          router.replace(`/product`);
        }
      } else {
        console.error(
          isEditMode
            ? "Failed to update product:"
            : "Failed to create product:",
          result.error
        );
        setFormError(
          result.error || "Failed to save product. Please try again."
        );
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating product:" : "Error creating product:",
        error
      );
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
      const result = await form.trigger(["name", "description", "stage"]);
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
    return (
      <>
        <Header fixed>
          <Search />
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown user={null} />
          </div>
        </Header>

        <Main>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 animate-pulse p-6">
              <div className="h-8 w-2/3 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded"></div>
              <div className="h-32 w-full bg-muted rounded mt-4"></div>
            </div>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Products", href: "/dashboard" },
                  ...(isEditMode && productToEdit
                    ? [
                        { label: productToEdit.name, href: "/product" },
                        {
                          label: "Edit Product",
                          href: "",
                          isCurrentPage: true,
                        },
                      ]
                    : [
                        {
                          label: "Create Product",
                          href: "",
                          isCurrentPage: true,
                        },
                      ]),
                ]}
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isEditMode
                ? `Edit ${productToEdit?.name || "Product"}`
                : templateId === "blank"
                  ? "Create a New Product"
                  : `Set Up Your ${selectedTemplate?.name || "Product"}`}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update your product details"
                : "Tell us about your product or startup to get started."}
            </p>
          </div>

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
                3
              </div>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Problem Statement"}
                {currentStep === 3 && "Additional Details"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 &&
                  "Tell us the basic details about your product."}
                {currentStep === 2 &&
                  "Describe the specific problem you're working on."}
                {currentStep === 3 &&
                  "Provide additional information to customize your experience."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product/Startup Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a name" {...field} />
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
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Briefly describe your product or startup"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stage</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select the current stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Discover">
                                  Discover
                                </SelectItem>
                                <SelectItem value="Validate">
                                  Validate
                                </SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Build">Build</SelectItem>
                                <SelectItem value="Secure">Secure</SelectItem>
                                <SelectItem value="Launch">Launch</SelectItem>
                                <SelectItem value="Grow">Grow</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Step 2: Problem Statement */}
                  {currentStep === 2 && (
                    <>
                      <FormField
                        control={form.control}
                        name="problem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              What problem are you working on?
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the specific problem you're trying to solve"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Suggestions:</p>
                        <div className="grid grid-cols-1 gap-3">
                          {problemSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              type="button"
                              className="justify-start h-auto min-h-[3.5rem] py-3 px-4 text-left text-sm break-words whitespace-normal font-normal"
                              onClick={() =>
                                form.setValue("problem", suggestion)
                              }
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Additional Details */}
                  {currentStep === 3 && (
                    <>
                      <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Members</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Who is working on this project with you?"
                                {...field}
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
                            <FormLabel>Website (if any)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com"
                                {...field}
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
                            <FormLabel>Country of Operation</FormLabel>
                            <CountrySelect
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {formError && (
                    <div className="text-destructive text-sm mt-2">
                      {formError}
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              {formError && (
                <div className="text-destructive text-sm absolute left-4">
                  {formError}
                </div>
              )}
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button type="button" onClick={goToNextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </Main>
    </>
  );
}
