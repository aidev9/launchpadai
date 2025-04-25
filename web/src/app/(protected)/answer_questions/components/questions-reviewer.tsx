"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  // CheckCircle,
  // Circle,
  Edit,
  Save,
  // Search,
  FileText,
  Check,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  getOrderedProductQuestions,
  deleteQuestionAction,
  answerProductQuestionAction,
} from "@/lib/firebase/actions/questions";
import {
  allQuestionsAtom,
  questionModalOpenAtom,
  selectedPhasesAtom,
  Question,
} from "@/lib/store/questions-store";
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
import { userProfileAtom, updateUserProfileAtom } from "@/lib/store/user-store";
import { toast as showToast } from "@/hooks/use-toast";
import React from "react";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

interface QuestionsReviewerProps {
  onShowToast: (options: ShowToastOptions) => void; // Add callback prop
}

// Define the component function first, then export a memoized version
function QuestionsReviewerComponent({ onShowToast }: QuestionsReviewerProps) {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [selectedPhases] = useAtom(selectedPhasesAtom);
  const [questionModalOpen, setModalOpen] = useAtom(questionModalOpenAtom);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
  const [userProfile] = useAtom(userProfileAtom);
  const [, updateUserProfile] = useAtom(updateUserProfileAtom);
  const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Memoize the filtered questions to prevent unnecessary re-renders
  const filteredQuestions = useMemo(() => {
    if (!allQuestions.length) return [];

    let filtered = [...allQuestions];

    // Filter by phase
    if (!selectedPhases.includes("All")) {
      filtered = filtered.filter((question) =>
        selectedPhases.includes(question.phase || "")
      );
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
  }, [filteredQuestions]);

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

  // Memoize the loadQuestions function
  const loadQuestions = useCallback(async () => {
    if (!selectedProductId) return;

    setIsLoading(true);
    try {
      const response = await getOrderedProductQuestions(selectedProductId);

      if (response.success && response.questions) {
        const questions = response.questions as Question[];
        console.log("Loaded questions:", questions.length);
        setAllQuestions(questions);

        // If we have questions and none is selected, select the first one
        if (questions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(questions[0].id);
          setAnswer(questions[0].answer || "");
        }
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error loading questions",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedProductId,
    setAllQuestions,
    selectedQuestionId,
    setSelectedQuestionId,
    setAnswer,
  ]);

  // Update the loadQuestions useEffect to use the memoized function
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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

  // Handle saving the answer
  const handleSave = async () => {
    if (!selectedProductId || !selectedQuestionId || !answer.trim()) return;

    // Find the current question state *before* saving
    const currentQuestion = allQuestions.find(
      (q) => q.id === selectedQuestionId
    );
    const wasPreviouslyAnswered = !!currentQuestion?.answer?.trim();

    setIsSaving(true);
    try {
      const response = await answerProductQuestionAction(
        selectedProductId,
        selectedQuestionId,
        answer
      );

      if (response.success) {
        // Update the question in the local state
        setAllQuestions((prev) =>
          prev.map((q) =>
            q.id === selectedQuestionId
              ? { ...q, answer, last_modified: new Date().toISOString() }
              : q
          )
        );

        const toastTitle = "Answer saved";
        let toastDescription = "Your answer has been saved successfully.";
        const toastVariant: "default" | "destructive" | undefined = "default";

        // Conditional XP Update
        if (!wasPreviouslyAnswered) {
          const awardedXp = 5;
          if (userProfile) {
            const newXp = (userProfile.xp || 0) + awardedXp;
            const updatedProfile = { ...userProfile, xp: newXp };
            updateUserProfile(updatedProfile); // Update the atom
            console.log(
              `User profile atom updated locally after FIRST answer. New XP: ${newXp}`
            );
            toastDescription = `Your answer has been saved successfully and you earned ${awardedXp} XP!`;
          } else {
            console.warn("User profile not available to update XP locally.");
            // Still show basic success message even if profile update fails locally
          }
        } else {
          console.log(
            "Question was previously answered, no XP awarded optimistically."
          );
          // Keep the default toastDescription
        }
        // Use callback for save success toast
        onShowToast({
          title: toastTitle,
          description: toastDescription,
          duration: 5000,
          variant: toastVariant,
        });
      } else {
        // Use callback for save failure toast
        onShowToast({
          title: "Error saving answer",
          description: response.error || "Failed to save answer",
          variant: "destructive",
        });
        // throw new Error(response.error || "Failed to save answer"); // Don't throw if showing toast
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      // Use callback for general save error toast
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

  // Special handler for Add Question button
  // const handleAddQuestion = () => {
  //   setModalOpen(true);
  // };

  // Log when component renders or modal state changes
  useEffect(() => {
    console.log("Modal state:", questionModalOpen);
  }, [questionModalOpen]);

  // Add a function to handle question deletion
  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedProductId || !questionId) return;

    try {
      // Call the server action to delete from Firebase
      const response = await deleteQuestionAction(
        questionId,
        selectedProductId
      );

      if (response.success) {
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
          duration: 5000, // Add duration
        });
      } else {
        // Use callback for delete failure toast
        onShowToast({
          title: "Error deleting question",
          description: response.error || "Failed to delete question",
          variant: "destructive",
        });
        // throw new Error(response.error || "Failed to delete question"); // Don't throw if showing toast
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

                {isLoading ? (
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
                      Add some questions to get started.
                    </p>
                    <AddQuestionButton />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className={`relative rounded-md border p-2 cursor-pointer transition-colors ${
                          selectedQuestionId === question.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedQuestionId(question.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                              selectedQuestionId === question.id
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground text-transparent"
                            }`}
                          >
                            {selectedQuestionId === question.id && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>

                          <div className="flex-1 flex items-center">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">
                              {question.question}
                            </span>
                          </div>

                          {isAnswered(question) && (
                            <div
                              className="w-2 h-2 rounded-full bg-green-500"
                              title="Has answer"
                            ></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                          {selectedQuestion.phase}
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
                          console.log(
                            "Edit button clicked for question ID:",
                            selectedQuestionId
                          );
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
                      onClick={handleSave}
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
              className="bg-red-600 hover:bg-red-700"
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
