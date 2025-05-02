"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  addPromptAction,
  updatePromptAction,
} from "@/lib/firebase/actions/prompts";
import { Prompt } from "@/lib/firebase/schema";
import { promptActionAtom } from "@/lib/store/prompt-store";
import { useToast } from "@/hooks/use-toast";
import { promptModalOpenAtom } from "@/lib/store/prompt-store";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { getCurrentUnixTimestamp, phaseOptions } from "@/utils/constants";
import { promptInputSchema, PromptInput } from "@/lib/firebase/schema";

// Product tag options (keeping for reference but not using in MultiSelect anymore)
const productOptions = [
  { label: "SaaS", value: "SaaS" },
  { label: "Mobile App", value: "Mobile App" },
  { label: "Marketplace", value: "Marketplace" },
  { label: "E-commerce", value: "E-commerce" },
  { label: "Web App", value: "Web App" },
];

// General tag options (keeping for reference but not using in MultiSelect anymore)
const tagOptions = [
  { label: "frontend", value: "frontend" },
  { label: "backend", value: "backend" },
  { label: "design", value: "design" },
  { label: "marketing", value: "marketing" },
  { label: "legal", value: "legal" },
  { label: "finance", value: "finance" },
  { label: "sales", value: "sales" },
  { label: "customer service", value: "customer service" },
];

interface PromptFormProps {
  promptEdited?: Prompt | null;
}

export function PromptForm({ promptEdited }: PromptFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setPromptAction = useSetAtom(promptActionAtom);
  const [promptModalOpen, setPromptModalOpen] = useAtom(promptModalOpenAtom);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<PromptInput>({
    resolver: zodResolver(promptInputSchema),
    defaultValues: {
      title: "",
      body: "",
      phaseTags: [],
      productTags: [],
      tags: [],
    },
    mode: "onChange",
  });

  // Update form values when editing an existing prompt or resetting form
  useEffect(() => {
    if (promptEdited) {
      console.log("Setting form values for editing:", promptEdited);
      form.reset({
        title: promptEdited.title,
        body: promptEdited.body,
        phaseTags: promptEdited.phaseTags,
        productTags: promptEdited.productTags,
        tags: promptEdited.tags,
      });
    } else {
      console.log("Resetting form to default values");
      form.reset({
        title: "",
        body: "",
        phaseTags: [],
        productTags: [],
        tags: [],
      });
    }
  }, [promptEdited, form, promptModalOpen]);

  const onSubmit = async (data: PromptInput) => {
    console.log("Form submission started with data:", data);
    setIsSubmitting(true);

    try {
      if (promptEdited) {
        // First close the modal before awaiting API response to prevent flickering
        setPromptModalOpen(false);

        // Update existing prompt using Server Action
        const result = await updatePromptAction(promptEdited.id, data);
        console.log("Update result:", result);
        if (result.success) {
          setPromptAction({
            type: "UPDATE",
            prompt: {
              ...promptEdited,
              ...data,
              updatedAt: getCurrentUnixTimestamp(),
            },
          });
          toast({
            title: "Prompt updated",
            description: "The prompt has been updated successfully.",
          });
          form.reset();
        } else {
          console.error("Failed to update prompt:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to update prompt",
            variant: "destructive",
          });
        }
      } else {
        // First close the modal before awaiting API response to prevent flickering
        setPromptModalOpen(false);

        // Add new prompt using Server Action
        try {
          const result = await addPromptAction(data);
          console.log("Add result:", result);
          if (result.success) {
            if (result.prompt) {
              setPromptAction({
                type: "ADD",
                prompt: result.prompt,
              });
              toast({
                title: "Prompt added",
                description: "The prompt has been added successfully.",
              });
            } else {
              throw new Error("Prompt data missing from server response.");
            }
            form.reset();
          } else {
            console.error("Failed to add prompt:", result.error);
            toast({
              title: "Error",
              description: result.error || "Failed to add prompt",
              variant: "destructive",
            });
          }
        } catch (submissionError) {
          console.error("Submission error:", submissionError);
          // Special handling for timeout errors
          if (
            submissionError instanceof Error &&
            submissionError.message.includes("timeout")
          ) {
            toast({
              title: "Connection Issues",
              description:
                "We're having trouble connecting to the database. Please check your internet connection and try again.",
              variant: "destructive",
              duration: 7000,
            });
          } else {
            toast({
              title: "Error",
              description:
                submissionError instanceof Error
                  ? submissionError.message
                  : "Failed to add prompt",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {promptEdited ? "Edit Prompt" : "Add New Prompt"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter prompt title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body field - moving up for better UX */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter prompt content..."
                      className="min-h-[150px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phase tags field */}
            <FormField
              control={form.control}
              name="phaseTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase Tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      placeholder="Select phases..."
                      selected={field.value}
                      options={phaseOptions}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product tags field */}
            <FormField
              control={form.control}
              name="productTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Type product tag and press comma or enter..."
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* General tags field */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Type tag and press comma or enter..."
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPromptModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? promptEdited
                    ? "Updating..."
                    : "Adding..."
                  : promptEdited
                    ? "Update Prompt"
                    : "Add Prompt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
