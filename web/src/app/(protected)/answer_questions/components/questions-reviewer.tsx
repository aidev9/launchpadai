"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, FileText, Check, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  allQuestionsAtom,
  questionModalOpenAtom,
  selectedPhasesAtom,
} from "@/lib/store/questions-store";
import { Question } from "@/lib/firebase/schema";
import { AddQuestionButton } from "./add-question-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast as showToast } from "@/hooks/use-toast";
import React from "react";
import {
  getCurrentUnixTimestamp,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";
import { useXpMutation } from "@/xp/useXpMutation";
import { firebaseQA } from "@/lib/firebase/client/FirebaseQA";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { ErrorDisplay } from "@/components/ui/error-display";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

interface QuestionsReviewerProps {
  onShowToast: (options: ShowToastOptions) => void; // Add callback prop
}

// Memoized question item to prevent unnecessary re-renders
const QuestionItem = React.memo(
  ({
    question,
    isSelected,
    isAnswered,
    onSelect,
  }: {
    question: Question;
    isSelected: boolean;
    isAnswered: boolean;
    onSelect: (id: string) => void;
  }) => {
    return (
      <div
        className={`relative rounded-md border p-2 cursor-pointer transition-colors ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/30 hover:bg-muted/30"
        }`}
        onClick={() => onSelect(question.id)}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-5 h-5 rounded-full border ${
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground text-transparent"
            }`}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </div>

          <div className="flex-1 flex items-center">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{question.question}</span>
          </div>

          {isAnswered && (
            <div
              className="w-2 h-2 rounded-full bg-green-500"
              title="Has answer"
            ></div>
          )}
        </div>
      </div>
    );
  }
);

QuestionItem.displayName = "QuestionItem";

// Add this memoized component for the questions list
const QuestionsList = React.memo(
  ({
    questions,
    selectedId,
    onSelectQuestion,
    isAnswered,
  }: {
    questions: Question[];
    selectedId: string;
    onSelectQuestion: (id: string) => void;
    isAnswered: (question: Question) => boolean;
  }) => {
    // If this component re-renders, it won't impact the parent component
    return (
      <div className="space-y-2">
        {questions.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            isSelected={selectedId === question.id}
            isAnswered={isAnswered(question)}
            onSelect={onSelectQuestion}
          />
        ))}
      </div>
    );
  }
);

QuestionsList.displayName = "QuestionsList";

// Define the component function first, then export a memoized version
function QuestionsReviewerComponent({ onShowToast }: QuestionsReviewerProps) {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [selectedPhases] = useAtom(selectedPhasesAtom);
  const [questionModalOpen, setModalOpen] = useAtom(questionModalOpenAtom);

  // Use a ref for the currently selected ID to avoid re-renders
  const selectedQuestionIdRef = useRef<string>("");
  const [selectedQuestionId, setSelectedQuestionIdState] = useState<string>("");

  // Create a stable function for setting the question ID that doesn't trigger re-renders
  // unless absolutely necessary
  const setSelectedQuestionId = useCallback(
    (id: string) => {
      // Always update the ref immediately
      selectedQuestionIdRef.current = id;

      // But only update state if it's different (to avoid re-renders)
      if (id !== selectedQuestionId) {
        setSelectedQuestionIdState(id);
      }
    },
    [selectedQuestionId]
  );

  const [answer, setAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);

  // Use React Firebase Hooks to get questions for the selected product
  const [questionData, isLoading, firestoreError] = useCollectionData(
    selectedProduct
      ? firebaseQA.getQuestionsByProduct(selectedProduct.id)
      : firebaseQA.getQuestions(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Store displayedQuestions as a ref to prevent re-renders
  const displayedQuestionsRef = useRef<Question[]>([]);
  const [displayedQuestions, setDisplayedQuestionsState] = useState<Question[]>(
    []
  );

  // Create a stable function for setting displayed questions
  const setDisplayedQuestions = useCallback(
    (questions: Question[]) => {
      // Always update the ref
      displayedQuestionsRef.current = questions;

      // Only update state if the questions have actually changed
      if (JSON.stringify(questions) !== JSON.stringify(displayedQuestions)) {
        setDisplayedQuestionsState(questions);
      }
    },
    [displayedQuestions]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Memoize the filtered questions to prevent unnecessary re-renders
  const filteredQuestions = useMemo(() => {
    if (!allQuestions.length) return [];

    let filtered = [...allQuestions];

    // Filter by phase
    if (!selectedPhases.includes("All")) {
      filtered = filtered.filter((question) => {
        return (
          question.phases &&
          Array.isArray(question.phases) &&
          question.phases.some((phase) => selectedPhases.includes(phase))
        );
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (question) =>
          question.question.toLowerCase().includes(term) ||
          (question.answer || "").toLowerCase().includes(term)
      );
    }

    // Sort by order
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    return filtered;
  }, [allQuestions, selectedPhases, searchTerm]);

  // Update displayed questions when filtered results change
  useEffect(() => {
    setDisplayedQuestions(filteredQuestions);
  }, [filteredQuestions, setDisplayedQuestions]);

  // Also update the filtering logic to use a ref for selectedQuestionId to break circular dependencies
  const previousSelectedQuestionIdRef = useRef(selectedQuestionId);

  // Update the selection check effect
  useEffect(() => {
    if (!selectedQuestionId) return;
    if (filteredQuestions.length === 0) return;

    const questionStillVisible = filteredQuestions.some(
      (question) => question.id === selectedQuestionId
    );

    if (
      !questionStillVisible &&
      previousSelectedQuestionIdRef.current === selectedQuestionId
    ) {
      setSelectedQuestionId("");
      setAnswer("");
    }

    previousSelectedQuestionIdRef.current = selectedQuestionId;
  }, [filteredQuestions, selectedQuestionId, setSelectedQuestionId, setAnswer]);

  // Update allQuestions atom when Firebase data changes
  useEffect(() => {
    if (questionData) {
      // Format the data to include document ID and apply typing
      const formattedQuestions = questionData.map((q: any) => ({
        ...q,
        id: q.id,
      })) as Question[];

      // Sort questions by their order property
      const sortedQuestions = [...formattedQuestions].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );

      // Check if questions have actually changed to avoid unnecessary updates
      const hasQuestionsChanged =
        sortedQuestions.length !== allQuestions.length ||
        JSON.stringify(sortedQuestions.map((q) => q.id).sort()) !==
          JSON.stringify(allQuestions.map((q) => q.id).sort());

      if (hasQuestionsChanged) {
        setAllQuestions(sortedQuestions);

        // Only select the first question if no question is currently selected
        if (sortedQuestions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(sortedQuestions[0].id);
          setAnswer(sortedQuestions[0].answer || "");
        }
      }
    }
  }, [
    questionData,
    setAllQuestions,
    selectedQuestionId,
    setSelectedQuestionId,
    setAnswer,
    allQuestions,
  ]);

  // Handle Firebase errors

  // Update answer when selecting a different question
  useEffect(() => {
    if (!selectedQuestionId || !allQuestions.length) return;

    const selectedQuestion = allQuestions.find(
      (q) => q.id === selectedQuestionId
    );

    if (selectedQuestion) {
      setAnswer(selectedQuestion.answer || "");
    }
  }, [selectedQuestionId, allQuestions]);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Handle saving the answer using FirebaseQA
  const handleSaveAnswer = async () => {
    if (!selectedProduct || !selectedQuestionId) {
      onShowToast({
        title: "Error",
        description: "No product or question selected",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Optimistic update - apply changes locally first
      setAllQuestions((prevQuestions) =>
        prevQuestions.map((q) => {
          if (q.id === selectedQuestionId) {
            return {
              ...q,
              answer,
              updatedAt: getCurrentUnixTimestamp(),
            };
          }
          return q;
        })
      );

      // Use FirebaseQA to update the question
      const updatedQuestion = await firebaseQA.updateQuestion(
        selectedQuestionId,
        {
          answer,
          updatedAt: getCurrentUnixTimestamp(),
        }
      );

      if (updatedQuestion) {
        // Award XP in background for answering a question
        xpMutation.mutate("answer_question");

        // Show success toast immediately
        onShowToast({
          title: "Answer saved",
          description:
            "Your answer has been saved successfully and you earned 10 XP!",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        // If update fails, show error and revert optimistic update
        onShowToast({
          title: "Error saving answer",
          description: "Failed to save answer",
          variant: "destructive",
        });

        // Revert the optimistic update if the server request failed
        setAllQuestions((prevQuestions) =>
          prevQuestions.map((q) => {
            if (q.id === selectedQuestionId) {
              return {
                ...q,
                answer: null, // or fetch the previous value from somewhere
              };
            }
            return q;
          })
        );
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      onShowToast({
        title: "Error saving answer",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Find selected question
  const selectedQuestion = allQuestions.find(
    (q) => q.id === selectedQuestionId
  );

  // Check if a question has been answered
  const isAnswered = (question: Question) => {
    return !!question.answer && question.answer.trim().length > 0;
  };

  // Add a function to handle question deletion using FirebaseQA
  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedProduct || !questionId) return;

    try {
      // Use FirebaseQA client to delete the question
      const success = await firebaseQA.deleteQuestion(questionId);

      if (success) {
        // Update the state after successful deletion
        setAllQuestions((prev) => prev.filter((q) => q.id !== questionId));

        // If the deleted question was selected, clear the selection
        if (questionId === selectedQuestionId) {
          setSelectedQuestionId("");
          setAnswer("");
        }

        // Use callback for delete success toast
        onShowToast({
          title: "Success",
          description: "Question deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        // Use callback for delete failure toast
        onShowToast({
          title: "Error deleting question",
          description: "Failed to delete question",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      // Use callback for general delete error toast
      onShowToast({
        title: "Error deleting question",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  // Create a stable question selection handler that never changes reference
  const handleSelectQuestion = useCallback(
    (id: string) => {
      // Don't re-render if clicking the already selected question
      if (id === selectedQuestionId) return;

      setSelectedQuestionId(id);

      // Find and set the answer immediately to avoid delay
      const question = allQuestions.find((q) => q.id === id);
      if (question) {
        setAnswer(question.answer || "");
      }
    },
    [setSelectedQuestionId, selectedQuestionId, allQuestions, setAnswer]
  );

  // Show error state if there's no selected product
  if (!selectedProduct) {
    return (
      <div className="rounded-lg bg-card text-card-foreground">
        <div className="flex items-center justify-center h-64 text-center p-4">
          <div>
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium mb-2">No Product Selected</h3>
            <p className="text-muted-foreground max-w-md">
              Please select a product to view and answer questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's a Firebase error
  if (firestoreError) {
    return (
      <ErrorDisplay
        error={firestoreError}
        title="Question rockets are offline!"
        message="Our question loading system hit some space debris. Mission control is working on it!"
        onRetry={() => window.location.reload()}
        retryText="Retry Launch"
        component="QuestionsReviewer"
        action="loading_questions"
        metadata={{
          productId: selectedProduct?.id,
          selectedPhases,
          searchTerm,
        }}
      />
    );
  }

  return (
    <div className="rounded-lg bg-card text-card-foreground">
      <div className="flex flex-col lg:flex-row lg:min-h-[500px] gap-4">
        {/* Left column - List of questions */}
        <div className="w-full lg:w-1/2">
          <Card className="h-full flex flex-col">
            <ScrollArea className="h-[500px]">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Questions</h3>
                </div>

                {/* Search/filter input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Filter questions..."
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FileText className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>

                {isLoading && displayedQuestions.length === 0 ? (
                  <div className="space-y-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                        />
                      ))}
                  </div>
                ) : displayedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-medium mb-2">
                      No Questions Found
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      {selectedProduct
                        ? "No questions found for this product. Create a new product to generate questions automatically, or add questions manually."
                        : "Add some questions to get started."}
                    </p>
                    <AddQuestionButton />
                  </div>
                ) : (
                  <QuestionsList
                    questions={displayedQuestions}
                    selectedId={selectedQuestionId}
                    onSelectQuestion={handleSelectQuestion}
                    isAnswered={isAnswered}
                  />
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right column - Question details */}
        <div className="flex-1 lg:flex-1">
          <Card className="h-full flex flex-col">
            {selectedQuestion ? (
              <>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold leading-tight mb-2">
                        {selectedQuestion.question}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {selectedQuestion.phases &&
                          selectedQuestion.phases.length > 0
                            ? selectedQuestion.phases[0]
                            : "No phase"}
                        </Badge>
                        {selectedQuestion.tags &&
                          selectedQuestion.tags.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                              Tags: {selectedQuestion.tags.join(", ")}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setModalOpen(true);
                          // Store the ID of the question being edited in localStorage for the modal to access
                          if (selectedQuestionId) {
                            localStorage.setItem(
                              "editingQuestionId",
                              selectedQuestionId
                            );
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (selectedQuestionId) {
                            setQuestionToDelete(selectedQuestionId);
                            setDeleteDialogOpen(true);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-6 flex-1 flex flex-col">
                  <label className="text-sm font-medium mb-2">
                    Your Answer
                  </label>

                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="min-h-[200px]"
                  />

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleSaveAnswer}
                      disabled={isSaving || !answer.trim()}
                      className="flex items-center gap-2"
                    >
                      {isSaving ? "Saving..." : "Save Answer"}
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">
                    No Question Selected
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Select a question from the list to view or answer it.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                questionToDelete && handleDeleteQuestion(questionToDelete)
              }
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export the memoized version
export const QuestionsReviewer = React.memo(QuestionsReviewerComponent);
