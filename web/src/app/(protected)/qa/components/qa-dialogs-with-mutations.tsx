import { atom, useAtom } from "jotai";
import { useState, useEffect } from "react";
import { z } from "zod";
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
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  addQAModalOpenAtom,
  editQAModalOpenAtom,
  deleteQAModalOpenAtom,
  selectedQuestionAtom,
  rowSelectionAtom,
  allQuestionsAtom,
  tableInstanceAtom,
} from "./qa-store";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Question } from "@/lib/firebase/schema";
import { toast as showToast } from "@/hooks/use-toast";
import { useXpMutation } from "@/xp/useXpMutation";
import { TOAST_DEFAULT_DURATION, phaseOptions } from "@/utils/constants";
import { useQuestionsQuery } from "../hooks/useQuestionsQuery";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Form schema for question
const questionFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  phases: z.array(z.string()).min(1, "Select at least one phase"),
  tags: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

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
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
  const [tableInstance] = useAtom(tableInstanceAtom);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [tags, setTags] = useState<string[]>([]);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Get the mutations from our custom hook
  const {
    addQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
  } = useQuestionsQuery(selectedProductId);

  // Initialize form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      answer: "",
      phases: ["Discover"],
      tags: "",
    },
  });

  // Update form values when editing a question
  useEffect(() => {
    if (selectedQuestion && editModalOpen) {
      form.reset({
        question: selectedQuestion.question,
        answer: selectedQuestion.answer || "",
        phases: selectedQuestion.phases || ["Discover"],
        tags: selectedQuestion.tags?.join(", ") || "",
      });

      // Set tags
      setTags(selectedQuestion.tags || []);
    }
  }, [selectedQuestion, editModalOpen, form]);

  // Reset form when opening the add modal
  useEffect(() => {
    if (addModalOpen) {
      form.reset({
        question: "",
        answer: "",
        phases: ["Discover"],
        tags: "",
      });
      setTags([]);
    }
  }, [addModalOpen, form]);

  // Handle form submission
  const onSubmit = async (data: QuestionFormValues) => {
    if (!selectedProductId) {
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
        question: data.question,
        answer: data.answer || null,
        tags: tags,
        phases: data.phases,
        phase: data.phases[0], // Use the first phase as the primary one
      };

      let response;

      // Use different mutations for add vs edit
      if (editModalOpen && selectedQuestion) {
        // Update existing question using Tanstack Query mutation
        response = await updateQuestionMutation.mutateAsync({
          productId: selectedProductId,
          questionId: selectedQuestion.id,
          questionData: questionData,
        });

        // Award XP for answering if an answer was added and wasn't there before
        if (data.answer && !selectedQuestion.answer) {
          // Using background mutation
          xpMutation.mutate("answer_question");
        }
      } else {
        // Add new question using Tanstack Query mutation
        response = await addQuestionMutation.mutateAsync({
          ...questionData,
          productId: selectedProductId,
        });

        // Award XP for adding a question - using background mutation
        xpMutation.mutate("add_question");
      }

      if (response.success) {
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

        // Show the toast
        onShowToast({
          title: "Success",
          description: toastDescription,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Close dialogs
        setAddModalOpen(false);
        setEditModalOpen(false);

        // Call onSuccess to refresh the questions list
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.error || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      onShowToast({
        title: "Error saving question",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Handle deleting a question
  const handleDelete = async () => {
    if (!selectedProductId) {
      onShowToast({
        title: "Error",
        description: "No product selected. Please select a product first.",
      });
      return;
    }

    try {
      // Determine if we're deleting a single question or multiple questions
      const isMultipleDelete =
        !selectedQuestion &&
        Object.keys(rowSelection as RowSelection).length > 0;

      if (isMultipleDelete) {
        // Get selected row indices
        const selectedRowIndices = Object.keys(rowSelection as RowSelection);
        console.log("Selected row indices:", selectedRowIndices);

        if (selectedRowIndices.length === 0) {
          onShowToast({
            title: "Error",
            description: "No questions selected for deletion",
          });
          return;
        }

        // Get the selected questions using the table instance
        let selectedQuestionIds: string[] = [];

        if (tableInstance) {
          // This is the most reliable approach - get the actual rows from the table
          // that are currently selected
          const selectedRows = tableInstance.getFilteredSelectedRowModel().rows;
          console.log("Selected rows:", selectedRows);

          selectedQuestionIds = selectedRows.map((row) => {
            // Extract the ID from the original data of each selected row
            const id = (row.original as Question).id;
            console.log(`Selected row original data:`, row.original);
            return id;
          });
        } else {
          // Fallback approach if table instance is not available
          selectedQuestionIds = selectedRowIndices
            .map((index) => {
              const question = allQuestions[parseInt(index, 10)];
              if (question && question.id) {
                console.log(`Found question ${question.id} at index ${index}`);
                return question.id;
              }
              return null;
            })
            .filter(Boolean) as string[];
        }

        console.log("Selected question IDs:", selectedQuestionIds);

        if (selectedQuestionIds.length === 0) {
          onShowToast({
            title: "Error",
            description: "Failed to map selected rows to question IDs",
          });
          return;
        }

        // Create a copy of questions to update optimistically
        let successCount = 0;
        let errorCount = 0;

        // Delete each selected question
        for (const id of selectedQuestionIds) {
          console.log(`Deleting question with ID: ${id}`);
          try {
            // Use the mutation to delete each question
            await deleteQuestionMutation.mutateAsync({
              productId: selectedProductId,
              questionId: id,
            });

            successCount++;
          } catch (error) {
            console.error(`Error deleting question ${id}:`, error);
            errorCount++;
          }
        }

        // Clear selection
        setRowSelection({});

        // Show appropriate toast message
        if (successCount > 0) {
          onShowToast({
            title: "Success",
            description:
              errorCount > 0
                ? `${successCount} questions deleted, ${errorCount} failed`
                : `${successCount} questions deleted successfully`,
          });
        } else {
          onShowToast({
            title: "Error",
            description: "Failed to delete any questions",
          });
        }
      } else if (selectedQuestion) {
        // Single question deletion using mutation
        console.log(`Deleting single question: ${selectedQuestion.id}`);
        await deleteQuestionMutation.mutateAsync({
          productId: selectedProductId,
          questionId: selectedQuestion.id,
        });

        onShowToast({
          title: "Success",
          description: "Question deleted successfully",
        });
      } else {
        throw new Error("No question selected for deletion");
      }

      // Close the modal
      setDeleteModalOpen(false);
      setSelectedQuestion(null);

      // Call onSuccess to refresh the questions list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      onShowToast({
        title: "Error deleting question",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <>
      {/* Add/Edit Question Dialog */}
      <Dialog
        open={addModalOpen || editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setEditModalOpen(false);
            setSelectedQuestion(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editModalOpen ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              {editModalOpen
                ? "Update the question details below."
                : "Enter the question details below."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your question here..."
                        className="resize-none"
                        {...field}
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
                        placeholder="Enter your answer here..."
                        className="resize-none"
                        {...field}
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
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  disabled={
                    addQuestionMutation.isPending ||
                    updateQuestionMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addQuestionMutation.isPending ||
                    updateQuestionMutation.isPending
                  }
                >
                  {addQuestionMutation.isPending ||
                  updateQuestionMutation.isPending
                    ? "Saving..."
                    : editModalOpen
                      ? "Update"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Add a small timeout to prevent flickering when closing the dialog
            setTimeout(() => {
              setDeleteModalOpen(false);
              setSelectedQuestion(null);
            }, 100);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              {selectedQuestion
                ? "Are you sure you want to delete this question? This action cannot be undone."
                : `Are you sure you want to delete ${
                    Object.keys(rowSelection as RowSelection).length
                  } selected questions? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
