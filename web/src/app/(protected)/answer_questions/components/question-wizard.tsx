"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { TagInput } from "@/components/ui/tag-input";
import {
  questionModalOpenAtom,
  allQuestionsAtom,
} from "@/lib/store/questions-store";
import { Question } from "@/lib/firebase/schema";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { toast } from "@/components/ui/use-toast";
import { addProductQuestionAction } from "@/lib/firebase/actions/questions";
import { useXpMutation } from "@/xp/useXpMutation";
import { type ToastActionElement } from "@/components/ui/toast";
import {
  getCurrentUnixTimestamp,
  phaseOptions,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";

// Define the type for toast options
type ShowToastOptions = {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
};

// Form schema for adding a new question
const formSchema = z.object({
  text: z
    .string()
    .min(3, { message: "Question must be at least 3 characters long" })
    .max(500, { message: "Question must be less than 500 characters" }),
  answer: z.string().optional(),
  phases: z.array(z.string()).min(1, { message: "Select at least one phase" }),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionWizardProps {
  // Add other props if needed, e.g., if it relies on page state
  onShowToast: (options: ShowToastOptions) => void; // Add callback prop
}

export function QuestionWizard({ onShowToast }: QuestionWizardProps) {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [modalOpen, setModalOpen] = useAtom(questionModalOpenAtom);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      answer: "",
      phases: [],
      tags: "",
    },
  });
  const { control, handleSubmit, reset, formState, setValue } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [tags, setTags] = useState<string[]>([]);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Reset the form when the modal opens
  useEffect(() => {
    if (modalOpen) {
      reset({
        text: "",
        answer: "",
        phases: [],
        tags: "",
      });
    }
  }, [modalOpen, reset]);

  // Use this in the useEffect for modal open/close
  useEffect(() => {
    if (modalOpen) {
      // Only run the code when the modal opens (not on every render)
      const storedEditingId =
        typeof window !== "undefined"
          ? localStorage.getItem("editingQuestionId")
          : null;

      // Only update state if absolutely necessary
      if (storedEditingId !== editingQuestionId) {
        console.log(
          "Updating editingQuestionId from localStorage:",
          storedEditingId
        );
        setEditingQuestionId(storedEditingId);

        // Only update isEditing if it would actually change
        const shouldBeEditing = !!storedEditingId;
        if (isEditing !== shouldBeEditing) {
          setIsEditing(shouldBeEditing);
        }

        // If editing, populate form with question data
        if (storedEditingId) {
          const questionToEdit = allQuestions.find(
            (q) => q.id === storedEditingId
          );
          if (questionToEdit) {
            // Use setValue instead of form.reset to potentially reduce re-renders
            setValue("text", questionToEdit.question);
            setValue("answer", questionToEdit.answer || "");
            setValue("phases", questionToEdit.phases || []);
            setValue("tags", questionToEdit.tags?.join(", ") || "");

            // Set tags
            setTags(questionToEdit.tags || []);
          }
        } else {
          // Reset form for new question - only if needed
          reset({
            text: "",
            answer: "",
            phases: [],
            tags: "",
          });
        }
      }
    } else if (!modalOpen) {
      // Complete reset when modal closes
      reset({
        text: "",
        answer: "",
        phases: [],
        tags: "",
      });
    }
  }, [modalOpen, allQuestions, editingQuestionId, isEditing, reset, control]);

  // Replace the debug logging effect with a more targeted one
  useEffect(() => {
    if (modalOpen) {
      console.log(
        "QuestionWizard - Modal opened, editing:",
        isEditing,
        "Question ID:",
        editingQuestionId
      );
    }
  }, [modalOpen, isEditing, editingQuestionId]);

  const onSubmit = async (data: FormValues) => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Add optimistic update
      const newQuestionId = crypto.randomUUID();
      const newQuestion: Question = {
        id: newQuestionId,
        question: data.text,
        answer: data.answer || null,
        tags: tags,
        phases: data.phases,
        order: (allQuestions?.length ?? 0) + 1, // Assign next order
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };

      // Add to state immediately for a snappy UI
      setAllQuestions((prev) => [newQuestion, ...(prev || [])]);

      // Close the modal
      setModalOpen(false);

      // Update the server
      const result = await addProductQuestionAction(selectedProductId, {
        question: data.text,
        answer: data.answer || null,
        tags: tags,
        phases: data.phases,
        phase: data.phases[0], // Use the first phase as the primary one
      });

      if (result.success) {
        // Award XP in the background
        xpMutation.mutate("ask_question");

        // Show success toast immediately
        onShowToast({
          title: "Question added",
          description:
            "Your question has been added successfully and you earned 5 XP!",
          duration: TOAST_DEFAULT_DURATION,
        });

        // Update the local state with the actual ID from the server if provided
        if (result.id) {
          setAllQuestions((prev) =>
            prev.map((q) => {
              if (q.id === newQuestionId) {
                return {
                  ...q,
                  id: result.id!,
                };
              }
              return q;
            })
          );
        }
      } else {
        // Remove the optimistic update if there was an error
        setAllQuestions((prev) => prev.filter((q) => q.id !== newQuestionId));

        onShowToast({
          title: "Error adding question",
          description: result.error || "Failed to add question",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      console.error("Error adding question:", error);

      onShowToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange:", open);

        // If closing the modal, reset the form
        if (!open) {
          reset({
            text: "",
            answer: "",
            phases: [],
            tags: "",
          });
        }

        setModalOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Question" : "Add New Question"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edit your question to improve your assets."
              : "Add a question to help generate better assets for your startup."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your question here..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter an answer if you already know it..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="phases"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phases</FormLabel>
                  <FormControl>
                    <MultiSelect
                      placeholder="Select phases..."
                      selected={field.value}
                      options={phaseOptions}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the phases this question applies to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Tags</FormLabel>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Type and press enter to add a tag..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Adding..."
                  : isEditing
                    ? "Update Question"
                    : "Add Question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
