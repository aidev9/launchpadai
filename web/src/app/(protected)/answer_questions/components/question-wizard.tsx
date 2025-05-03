"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  questionModalOpenAtom,
  allQuestionsAtom,
  Question,
} from "@/lib/store/questions-store";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { toast } from "@/components/ui/use-toast";
import {
  addProductQuestionAction,
  updateProductQuestionAction,
} from "@/lib/firebase/actions/questions";
import { useXp } from "@/xp/useXp";
import { toast as showToast } from "@/hooks/use-toast";
import { phaseOptions, TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Form schema for adding a new question
const formSchema = z.object({
  text: z
    .string()
    .min(3, { message: "Question must be at least 3 characters long" })
    .max(500, { message: "Question must be less than 500 characters" }),
  answer: z.string().optional(),
  phases: z.array(z.string()).min(1, { message: "Select at least one phase" }),
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
  const { awardXp } = useXp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );

  // Form for adding a new question
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      answer: "",
      phases: [],
    },
  });

  // Add a utility function to completely reset the form state - memoized with useCallback
  const resetFormCompletely = useCallback(() => {
    // Use form.setValue instead of form.reset to potentially avoid re-renders
    form.setValue("text", "");
    form.setValue("answer", "");
    form.setValue("phases", []);

    // Clear editing state
    setIsEditing(false);
    setEditingQuestionId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("editingQuestionId");
    }
  }, [form]);

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
            form.setValue("text", questionToEdit.question);
            form.setValue("answer", questionToEdit.answer || "");
            form.setValue(
              "phases",
              questionToEdit.tags?.map(
                (tag) => tag.charAt(0).toUpperCase() + tag.slice(1)
              ) || [questionToEdit.phase]
            );
          }
        } else {
          // Reset form for new question - only if needed
          resetFormCompletely();
        }
      }
    } else if (!modalOpen) {
      // Complete reset when modal closes
      resetFormCompletely();
    }
  }, [
    modalOpen,
    allQuestions,
    editingQuestionId,
    isEditing,
    resetFormCompletely,
    form,
  ]);

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

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingQuestionId) {
        // Update existing question using the new updateProductQuestionAction function
        const response = await updateProductQuestionAction(
          selectedProductId,
          editingQuestionId,
          {
            question: data.text,
            answer: data.answer || null,
            tags: data.phases.map((phase) => phase.toLowerCase()),
            phase: data.phases[0], // Use the first phase as the primary one
          }
        );

        if (response.success) {
          // Update the question in local state
          setAllQuestions((prev) =>
            prev.map((q) =>
              q.id === editingQuestionId
                ? {
                    ...q,
                    question: data.text,
                    answer: data.answer || null,
                    tags: data.phases.map((phase) => phase.toLowerCase()),
                    phase: data.phases[0],
                    last_modified: new Date(),
                  }
                : q
            )
          );

          // Use callback for update success toast
          onShowToast({
            title: "Success",
            description: "Question updated successfully",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          // Show error if update fails
          onShowToast({
            title: "Error updating question",
            description: response.error || "Failed to update question",
            variant: "destructive",
          });
          throw new Error(response.error || "Failed to update question");
        }
      } else {
        // Create new question using server action
        console.log("Submitting question data:", {
          question: data.text,
          answer: data.answer || null,
          tags: data.phases.map((phase) => phase.toLowerCase()),
          phase: data.phases[0], // Primary phase
        });

        const response = await addProductQuestionAction(selectedProductId, {
          question: data.text,
          answer: data.answer || null,
          tags: data.phases.map((phase) => phase.toLowerCase()),
          phase: data.phases[0], // Use the first phase as the primary one
        });

        console.log("Server response:", response);

        if (response.success && response.id) {
          // Add the new question to local state
          const newQuestion: Question = {
            id: response.id,
            question: data.text,
            answer: data.answer || null,
            tags: data.phases.map((phase) => phase.toLowerCase()),
            phase: data.phases[0],
            order: (allQuestions?.length ?? 0) + 1, // Assign next order
            last_modified: new Date(), // Use current date for new question
            createdAt: new Date(), // Add createdAt timestamp
          };
          setAllQuestions((prev) => [...(prev || []), newQuestion]);

          // --- Award XP and show toast via callback ---
          const addQuestionActionId = "add_question";
          const pointsAwarded = 5;
          console.log(
            `Question added. Awarding XP for action: ${addQuestionActionId}`
          );
          try {
            await awardXp(addQuestionActionId);
            // Use callback for success toast with XP (inside timeout)
            setTimeout(() => {
              onShowToast({
                title: "Question added",
                description: `Your question has been added successfully and you earned ${pointsAwarded} XP!`,
                duration: TOAST_DEFAULT_DURATION,
              });
            }, 100);
          } catch (error) {
            console.log("error:", error);
            setTimeout(() => {
              onShowToast({
                title: "Question added",
                description: "Your question has been added successfully.",
                duration: TOAST_DEFAULT_DURATION,
              });
            }, 100);
          }
          // --- End XP Award ---
        } else {
          // Use callback for create error toast
          onShowToast({
            title: "Error adding question",
            description: response.error || "Failed to add question",
            variant: "destructive",
          });
          // throw new Error(response.error || "Failed to add question"); // Don't throw if showing toast
        }
      }

      // Close the modal and reset form on success (both create/update)
      setModalOpen(false);
      resetFormCompletely();
    } catch (error) {
      console.error("Error adding/updating question:", error);
      // Use callback for general error toast
      onShowToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
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
          resetFormCompletely();
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
