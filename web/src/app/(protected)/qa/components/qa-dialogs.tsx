"use client";

import { atom, useAtom } from "jotai";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagInput } from "@/components/ui/tag-input";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  addQAModalOpenAtom,
  editQAModalOpenAtom,
  deleteQAModalOpenAtom,
  selectedQuestionAtom,
  rowSelectionAtom,
  tableInstanceAtom,
} from "./qa-store";
import { selectedProductAtom } from "@/lib/store/product-store";
import {
  Question,
  Phases,
  questionInputSchema,
  QuestionInput,
} from "@/lib/firebase/schema";
import { toast as showToast } from "@/hooks/use-toast";
import { useXpMutation } from "@/xp/useXpMutation";
import {
  TOAST_DEFAULT_DURATION,
  phaseOptions,
  getCurrentUnixTimestamp,
} from "@/utils/constants";
import { clientAuth as auth } from "@/lib/firebase/client";
import { firebaseQA } from "@/lib/firebase/client/FirebaseQA";
import { z } from "zod";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Add a type for row selection
type RowSelection = Record<string, boolean>;

interface QADialogsProps {
  onSuccess?: () => void;
  onShowToast: (options: ShowToastOptions) => void;
}

export function QADialogs({ onSuccess, onShowToast }: QADialogsProps) {
  const [addModalOpen, setAddModalOpen] = useAtom(addQAModalOpenAtom);
  const [editModalOpen, setEditModalOpen] = useAtom(editQAModalOpenAtom);
  const [deleteModalOpen, setDeleteModalOpen] = useAtom(deleteQAModalOpenAtom);
  const [selectedQuestion, setSelectedQuestion] = useAtom(selectedQuestionAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [tableInstance] = useAtom(tableInstanceAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Initialize form
  const productId = selectedProduct?.id;
  const form = useForm<z.infer<typeof questionInputSchema>>({
    resolver: zodResolver(questionInputSchema) as any,
    defaultValues: {
      question: "",
      answer: null,
      phases: [Phases.DISCOVER],
      tags: [],
      productId: productId ?? undefined,
    },
  });

  // Update form values when editing a question
  useEffect(() => {
    if (selectedQuestion && editModalOpen) {
      form.reset({
        question: selectedQuestion.question,
        answer: selectedQuestion.answer,
        phases: selectedQuestion.phases || [],
        tags: selectedQuestion.tags || [],
        productId: productId ?? undefined,
      });
    }
  }, [selectedQuestion, editModalOpen, form, productId]);

  // Reset form when opening the add modal
  useEffect(() => {
    if (addModalOpen) {
      form.reset({
        question: "",
        answer: null,
        phases: [],
        tags: [],
        productId: productId ?? undefined,
      });
    }
  }, [addModalOpen, form, productId]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof questionInputSchema>) => {
    if (!productId) {
      onShowToast({
        title: "Error",
        description: "No product selected. Please select a product first.",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    try {
      // Prepare question data
      const questionData = {
        ...data,
        userId: auth.currentUser?.uid || "",
        productId,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };

      let success = false;

      // Use different operations for add vs edit
      if (editModalOpen && selectedQuestion) {
        // Update existing question using FirebaseQA
        const updatedQuestion = await firebaseQA.updateQuestion(
          selectedQuestion.id,
          questionData
        );
        success = !!updatedQuestion;

        // Award XP for answering if an answer was added and wasn't there before
        if (data.answer && !selectedQuestion.answer) {
          // Using background mutation
          xpMutation.mutate("answer_question");
        }
      } else {
        // Add new question using FirebaseQA
        const newQuestion = await firebaseQA.createQuestion(questionData);
        success = !!newQuestion;

        // Award XP for adding a question - using background mutation
        xpMutation.mutate("add_question");
      }

      if (success) {
        const isAdding = !editModalOpen;
        const isAnsweringFirstTime =
          editModalOpen && data.answer && !selectedQuestion?.answer;

        let toastDescription = isAdding
          ? "Question added successfully"
          : "Question updated successfully";

        if (isAnsweringFirstTime) {
          toastDescription = "Answer saved successfully. You earned 5 XP!";
        } else if (isAdding) {
          toastDescription += ". You earned 5 XP!";
        }

        // Show success toast
        onShowToast({
          title: "Success",
          description: toastDescription,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Close the modal
        if (editModalOpen) {
          setEditModalOpen(false);
        } else {
          setAddModalOpen(false);
        }

        // Reset form
        form.reset();

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      onShowToast({
        title: "Error",
        description: "Failed to save question. Please try again.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      // Check if we have a selected question or row selections
      if (selectedQuestion) {
        // Single question delete (from the row actions menu)
        const success = await firebaseQA.deleteQuestion(selectedQuestion.id);

        if (success) {
          // Show success toast
          onShowToast({
            title: "Success",
            description: "Question deleted successfully",
            duration: TOAST_DEFAULT_DURATION,
          });

          // Close modal and reset selection
          setDeleteModalOpen(false);
          setSelectedQuestion(null);
          setRowSelection({});
        }
      } else if (Object.keys(rowSelection).length > 0) {
        // Multiple questions delete - get the selected question IDs directly
        // Since we're using getRowId in the table, these are now document IDs
        const selectedIds = Object.keys(rowSelection);

        // Delete selected questions
        const success = await firebaseQA.deleteQuestions(selectedIds);

        if (success) {
          // Show success toast
          onShowToast({
            title: "Success",
            description: `${selectedIds.length} question${selectedIds.length > 1 ? "s" : ""} deleted successfully`,
            duration: TOAST_DEFAULT_DURATION,
          });

          // Close modal and reset selection
          setDeleteModalOpen(false);
          setRowSelection({});
        }
      } else {
        // No selection
        onShowToast({
          title: "Error",
          description: "No question selected for deletion",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setDeleteModalOpen(false);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      onShowToast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      setDeleteModalOpen(false);
    }
  };

  return (
    <>
      {/* Add/Edit Question Dialog */}
      <Dialog
        open={addModalOpen || editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (addModalOpen) setAddModalOpen(false);
            if (editModalOpen) setEditModalOpen(false);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editModalOpen ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              {editModalOpen
                ? "Make changes to your question here"
                : "Add a new question here"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question Field */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your question"
                        {...field}
                        data-testid="question-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answer Field */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the answer"
                        {...field}
                        value={field.value || ""}
                        data-testid="answer-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phases Field */}
              <FormField
                control={form.control}
                name="phases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phases</FormLabel>
                    <FormControl>
                      <MultiSelect
                        selected={field.value}
                        options={phaseOptions}
                        onChange={field.onChange}
                        placeholder="Select phases"
                        data-testid="phases-select"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Field */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        placeholder="Enter tags"
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="tags-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={xpMutation.isPending}
                  data-testid="submit-question-button"
                >
                  {xpMutation.isPending
                    ? "Saving..."
                    : editModalOpen
                      ? "Save Changes"
                      : "Add Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              data-testid="cancel-delete-button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={xpMutation.isPending}
              data-testid="confirm-delete-button"
            >
              {xpMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
