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
import { Badge } from "@/components/ui/badge";
import {
  addQAModalOpenAtom,
  editQAModalOpenAtom,
  deleteQAModalOpenAtom,
  selectedQuestionAtom,
  rowSelectionAtom,
  allQuestionsAtom,
  tableInstanceAtom,
} from "./qa-store";
import { phaseOptions } from "../data/data";
import {
  addProductQuestionAction,
  deleteQuestionAction,
  updateProductQuestionAction,
} from "@/lib/firebase/actions/questions";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Question } from "../data/schema";
import { toast as showToast } from "@/hooks/use-toast";
import { useXp } from "@/xp/useXp";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Form schema for question
const questionFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  phase: z.string().optional(),
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
  const { awardXp } = useXp();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      answer: "",
      phase: "Discover",
      tags: "",
    },
  });

  // Update form values when editing a question
  useEffect(() => {
    if (selectedQuestion && editModalOpen) {
      form.reset({
        question: selectedQuestion.question,
        answer: selectedQuestion.answer || "",
        phase: selectedQuestion.phase || "Discover",
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
        phase: "Discover",
        tags: "",
      });
      setTags([]);
      setTagInput("");
    }
  }, [addModalOpen, form]);

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

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

    setIsSubmitting(true);

    try {
      // Prepare question data
      const questionData = {
        question: data.question,
        answer: data.answer || null,
        tags: tags,
        phase: data.phase,
      };

      let response;

      // Use different functions for add vs edit
      if (editModalOpen && selectedQuestion) {
        // Update existing question
        response = await updateProductQuestionAction(
          selectedProductId,
          selectedQuestion.id,
          questionData
        );
      } else {
        // Add new question
        response = await addProductQuestionAction(
          selectedProductId,
          questionData
        );
      }

      if (response.success) {
        const isAdding = !editModalOpen;
        const isAnsweringFirstTime =
          editModalOpen && data.answer && !selectedQuestion?.answer;

        let toastDescription = isAdding
          ? "Question added successfully"
          : "Question updated successfully";
        let pointsAwarded = 0;
        let actionId = "";

        if (isAdding) {
          actionId = "add_question";
          pointsAwarded = 5; // Points for adding a question
        } else if (isAnsweringFirstTime) {
          actionId = "answer_question";
          pointsAwarded = 5; // Points for answering a question
          toastDescription = "Answer saved successfully"; // Update description for answering
        }

        // Award XP if applicable
        if (actionId && pointsAwarded > 0) {
          try {
            await awardXp(actionId);
            toastDescription += ` You earned ${pointsAwarded} XP!`;
          } catch (error) {
            console.log("error:", error);
          }
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

        // Refresh questions
        if (response.question) {
          // Update local state
          if (editModalOpen && selectedQuestion) {
            // Update existing question
            setAllQuestions(
              allQuestions.map((q) =>
                q.id === selectedQuestion.id
                  ? (response.question as unknown as Question)
                  : q
              )
            );
          } else {
            // Add new question
            setAllQuestions([
              ...allQuestions,
              response.question as unknown as Question,
            ]);
          }
        }

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
    } finally {
      setIsSubmitting(false);
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

    setIsSubmitting(true);

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
          setIsSubmitting(false);
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
          setIsSubmitting(false);
          return;
        }

        // Create a copy of questions to update optimistically
        let updatedQuestions = [...allQuestions];
        let successCount = 0;
        let errorCount = 0;

        // Delete each selected question
        for (const id of selectedQuestionIds) {
          console.log(`Deleting question with ID: ${id}`);
          try {
            const response = await deleteQuestionAction(selectedProductId, id);
            console.log(`Delete response for ${id}:`, response);

            if (response.success) {
              // Filter out the deleted question from our local copy
              updatedQuestions = updatedQuestions.filter((q) => q.id !== id);
              successCount++;
            } else {
              console.error(`Failed to delete question ${id}:`, response.error);
              errorCount++;
            }
          } catch (error) {
            console.error(`Error deleting question ${id}:`, error);
            errorCount++;
          }
        }

        // Update local state immediately (optimistic update)
        setAllQuestions(updatedQuestions);

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
        // Single question deletion
        console.log(`Deleting single question: ${selectedQuestion.id}`);
        const response = await deleteQuestionAction(
          selectedProductId,
          selectedQuestion.id
        );

        if (response.success) {
          // Update local state immediately (optimistic update)
          setAllQuestions(
            allQuestions.filter((q) => q.id !== selectedQuestion.id)
          );

          onShowToast({
            title: "Success",
            description: "Question deleted successfully",
          });
        } else {
          throw new Error(response.error || "Failed to delete question");
        }
      } else {
        throw new Error("No question selected for deletion");
      }

      // Call onSuccess to refresh the questions list, but only if we need to
      // This helps avoid unnecessary flickering
      if (onSuccess) {
        // Delay the refresh to avoid flicker
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      onShowToast({
        title: "Error deleting question",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedQuestion(null);
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
                name="phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phase</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a phase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phaseOptions.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex items-center space-x-2 mt-1.5">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {tag}</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
