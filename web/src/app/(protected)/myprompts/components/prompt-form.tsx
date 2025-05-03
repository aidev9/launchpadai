"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
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
import { Prompt } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import { phaseOptions, TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { promptInputSchema, PromptInput } from "@/lib/firebase/schema";

interface PromptFormProps {
  prompt?: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromptInput, promptId?: string) => Promise<any>;
}

export function PromptForm({
  prompt,
  open,
  onOpenChange,
  onSubmit,
}: PromptFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Update form values when editing an existing prompt
  useEffect(() => {
    if (prompt) {
      form.reset({
        title: prompt.title,
        body: prompt.body,
        phaseTags: prompt.phaseTags,
        productTags: prompt.productTags,
        tags: prompt.tags,
      });
    } else {
      form.reset({
        title: "",
        body: "",
        phaseTags: [],
        productTags: [],
        tags: [],
      });
    }
  }, [prompt, form, open]);

  const handleSubmit = async (data: PromptInput) => {
    setIsSubmitting(true);

    try {
      console.log("Form submitted with data:", data);
      console.log("Prompt ID for editing:", prompt?.id);
      await onSubmit(data, prompt?.id);
      // Dialog closing is now handled by the parent component
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {prompt ? "Edit Prompt" : "Create New Prompt"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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

            {/* Body field */}
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
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? prompt
                    ? "Updating..."
                    : "Creating..."
                  : prompt
                    ? "Update Prompt"
                    : "Create Prompt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
