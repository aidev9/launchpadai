"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addProductQuestionAction } from "@/lib/firebase/actions/questions";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  allQuestionsAtom,
  questionModalOpenAtom,
  Question,
} from "@/lib/store/questions-store";
import { toast } from "@/components/ui/use-toast";

// Phase options for dropdown
const phaseOptions = [
  { value: "Discover", label: "Discover" },
  { value: "Validate", label: "Validate" },
  { value: "Design", label: "Design" },
  { value: "Build", label: "Build" },
  { value: "Secure", label: "Secure" },
  { value: "Launch", label: "Launch" },
  { value: "Grow", label: "Grow" },
];

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

export function QuestionWizard() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [modalOpen, setModalOpen] = useAtom(questionModalOpenAtom);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
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

  // Add a utility function to completely reset the form state
  const resetFormCompletely = () => {
    // Reset the form fields
    form.reset({
      text: "",
      answer: "",
      phases: [],
    });

    // Clear editing state
    setIsEditing(false);
    setEditingQuestionId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("editingQuestionId");
    }
  };

  // Use this in the useEffect for modal open/close
  useEffect(() => {
    if (modalOpen) {
      // Only run the code when the modal opens (not on every render)
      const storedEditingId = localStorage.getItem("editingQuestionId");

      if (storedEditingId !== editingQuestionId) {
        setEditingQuestionId(storedEditingId);
        setIsEditing(!!storedEditingId);

        // If editing, populate form with question data
        if (storedEditingId) {
          const questionToEdit = allQuestions.find(
            (q) => q.id === storedEditingId
          );
          if (questionToEdit) {
            form.reset({
              text: questionToEdit.question,
              answer: questionToEdit.answer || "",
              phases: questionToEdit.tags?.map(
                (tag) => tag.charAt(0).toUpperCase() + tag.slice(1)
              ) || [questionToEdit.phase], // Capitalize first letter
            });
          }
        } else {
          // Reset form for new question
          resetFormCompletely();
        }
      }
    } else if (!modalOpen) {
      // Complete reset when modal closes
      resetFormCompletely();
    }
  }, [modalOpen, allQuestions, form, editingQuestionId]);

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
        // Update existing question
        // TODO: Add an update question function to your Firebase actions
        // For now, we'll just update it in the local state
        setAllQuestions((prev) =>
          prev.map((q) =>
            q.id === editingQuestionId
              ? {
                  ...q,
                  question: data.text,
                  answer: data.answer || null,
                  tags: data.phases.map((phase) => phase.toLowerCase()),
                  phase: data.phases[0], // Use the first phase as the primary one
                  last_modified: new Date(),
                }
              : q
          )
        );

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
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
            phase: data.phases[0], // Use the first phase as the primary one
            order: allQuestions.length + 1, // Place at the end
            last_modified: new Date(),
            createdAt: new Date(),
          };

          setAllQuestions((prev) => [...prev, newQuestion]);

          toast({
            title: "Success",
            description: "Question added successfully",
          });
        } else {
          throw new Error(response.error || "Failed to add question");
        }
      }

      // Reset form and close modal
      resetFormCompletely();
      setModalOpen(false);
    } catch (error) {
      console.error(
        isEditing ? "Error updating question:" : "Error adding question:",
        error
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : isEditing
              ? "Failed to update question"
              : "Failed to add question",
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
