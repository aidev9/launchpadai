"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useAtom, atom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Check,
  Filter,
} from "lucide-react";
import { ensureProductQuestions } from "@/lib/firebase/products";
import { Badge } from "@/components/ui/badge";
import { tagOptions } from "../../questions/data/data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addProductQuestion } from "@/lib/firebase/questions";
import { getAllProducts } from "@/lib/firebase/products";
import {
  saveQuestionAnswer,
  getOrderedProductQuestions,
} from "@/lib/firebase/actions/questions";

// Modal state atom
export const questionModalOpenAtom = atom(false);

// Define the question type
interface Question {
  id: string;
  question: string;
  answer: string | null;
  tags: string[];
  order: number;
  phase?: string;
  last_modified: Date | string;
  createdAt: Date | string;
}

// Memoized category component to prevent unnecessary re-renders
const PhaseCategory = memo(
  ({
    phase,
    isSelected,
    onToggle,
    answeredCount,
    totalCount,
  }: {
    phase: { value: string; label: string };
    isSelected: boolean;
    onToggle: (value: string) => void;
    answeredCount: number;
    totalCount: number;
  }) => (
    <div
      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
        isSelected ? "bg-primary/10" : "hover:bg-muted"
      }`}
      onClick={() => onToggle(phase.value)}
    >
      <div className="flex items-center">
        {isSelected && <Check className="h-4 w-4 mr-2 text-primary" />}
        <span className="font-medium">{phase.label}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {answeredCount}/{totalCount}
      </div>
    </div>
  )
);

PhaseCategory.displayName = "PhaseCategory";

// Memoized question card component
const QuestionCard = memo(
  ({
    question,
    answer,
    setAnswer,
    saveStatus,
    onSave,
    onBack,
    onFinish,
    canGoBack,
  }: {
    question: Question;
    answer: string;
    setAnswer: (value: string) => void;
    saveStatus: "idle" | "saving" | "success" | "error";
    onSave: () => void;
    onBack: () => void;
    onFinish: () => void;
    canGoBack: boolean;
  }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="transition-opacity duration-300">
            {question.question}
          </span>
          <Badge variant="outline" className="ml-4">
            {question.phase}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          className="resize-none transition-all duration-300"
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onFinish}>
            Finish Later
          </Button>
          {canGoBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            disabled={!answer.trim() || saveStatus === "saving"}
            className="flex items-center gap-2"
          >
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "error" && (
              <>
                Error <AlertCircle className="h-4 w-4" />
              </>
            )}
            {saveStatus === "idle" || saveStatus === "success" ? (
              <>
                Next <ChevronRight className="h-4 w-4" />
              </>
            ) : null}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
);

QuestionCard.displayName = "QuestionCard";

export function QuestionWizard() {
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answer, setAnswer] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useAtom(questionModalOpenAtom);
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(true);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  // Handle cases where localStorage is empty - redirect to product selection
  useEffect(() => {
    const checkProductId = async () => {
      if (!selectedProductId) {
        // Try to get products from the server
        try {
          const response = await getAllProducts();
          if (
            response.success &&
            response.products &&
            response.products.length > 0
          ) {
            // Use the first product if available
            setSelectedProductId(response.products[0].id);
            console.log(
              "No product selected, using first available product:",
              response.products[0].id
            );
          } else {
            // No products available, redirect to dashboard
            console.log("No products available, redirecting to dashboard");
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching products:", error);
          router.push("/dashboard");
        }
      }
    };

    checkProductId();
  }, [selectedProductId, router, setSelectedProductId]);

  // Preload questions when the page first renders
  useEffect(() => {
    // Preload questions in the background
    const preloadQuestions = async () => {
      if (!selectedProductId) return;

      try {
        // Start request immediately but don't set loading state to keep UI responsive
        const controller = new AbortController();
        const signal = controller.signal;

        // Start loading data with 200ms delay before showing loading indicator
        const loadingTimer = setTimeout(() => {
          if (!allQuestions.length) {
            setIsLoading(true);
          }
        }, 200);

        // Fetch questions data
        const response = await getOrderedProductQuestions(selectedProductId);

        // Clear loading timer
        clearTimeout(loadingTimer);

        if (response.success && response.questions) {
          const loadedQuestions = response.questions.map((q: any) => {
            const phaseTag = q.tags?.find((tag: string) =>
              [
                "discover",
                "validate",
                "design",
                "build",
                "secure",
                "launch",
                "grow",
              ].includes(tag)
            );

            return {
              ...q,
              phase:
                q.phase ||
                (phaseTag
                  ? phaseTag.charAt(0).toUpperCase() + phaseTag.slice(1)
                  : "Other"),
            };
          });

          setAllQuestions(loadedQuestions);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error preloading questions:", error);
        setIsLoading(false);
      }
    };

    preloadQuestions();
  }, [selectedProductId]);

  // Load questions from Firebase when component mounts - This is now a backup in case preloading fails
  useEffect(() => {
    // Skip if questions are already loaded
    if (allQuestions.length > 0) return;

    const loadQuestions = async () => {
      if (!selectedProductId) return;

      // Only show loading state on initial load or product change, not category selection
      if (allQuestions.length === 0) {
        setIsLoading(true);
      }

      try {
        // Load questions using the new server action
        const response = await getOrderedProductQuestions(selectedProductId);

        if (response.success && response.questions) {
          const loadedQuestions = response.questions.map((q: any) => {
            // Extract phase from tags for backward compatibility
            const phaseTag = q.tags?.find((tag: string) =>
              [
                "discover",
                "validate",
                "design",
                "build",
                "secure",
                "launch",
                "grow",
              ].includes(tag)
            );

            // If phase is directly available, use it; otherwise, extract from tags
            const phase =
              q.phase ||
              (phaseTag
                ? phaseTag.charAt(0).toUpperCase() + phaseTag.slice(1)
                : "Other");

            return {
              ...q,
              phase,
            };
          });

          setAllQuestions(loadedQuestions);

          // If no currentQuestionIndex set, start at the first question
          if (currentQuestionIndex === 0 && loadedQuestions.length > 0) {
            // Find the first question that matches selected phases, if any
            if (selectedPhases.length > 0) {
              const firstMatchingIndex = loadedQuestions.findIndex((q) =>
                q.tags.some((tag: string) =>
                  selectedPhases.includes(tag.toLowerCase())
                )
              );
              if (firstMatchingIndex !== -1) {
                setCurrentQuestionIndex(firstMatchingIndex);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [selectedProductId]);

  // Get filtered questions based on selected phases
  const filteredQuestions = useMemo(() => {
    if (selectedPhases.length === 0) return allQuestions;

    return allQuestions.filter((q) =>
      (q.tags as string[]).some((tag: string) =>
        selectedPhases.includes(tag.toLowerCase())
      )
    );
  }, [allQuestions, selectedPhases]);

  // Calculate answered questions count
  const answeredFilteredQuestions = useMemo(() => {
    return filteredQuestions.filter((q) => q.answer && q.answer.trim() !== "");
  }, [filteredQuestions]);

  // Calculate progress
  const progress = useMemo(() => {
    return filteredQuestions.length > 0
      ? Math.floor(
          (answeredFilteredQuestions.length / filteredQuestions.length) * 100
        )
      : 0;
  }, [filteredQuestions.length, answeredFilteredQuestions.length]);

  // Get unanswered questions
  const unansweredQuestions = useMemo(() => {
    return filteredQuestions.filter((q) => !q.answer || q.answer.trim() === "");
  }, [filteredQuestions]);

  // Find the index of the current question in the filtered questions array
  const getCurrentQuestionDisplayIndex = () => {
    if (!currentQuestion) return 0;
    return filteredQuestions.findIndex((q) => q.id === currentQuestion.id) + 1;
  };

  // Current question based on filtered list and current index
  const currentQuestion = useMemo(() => {
    if (filteredQuestions.length === 0) return null;

    // If there are unanswered questions and we're showing only unanswered
    if (showOnlyUnanswered && unansweredQuestions.length > 0) {
      return unansweredQuestions[
        Math.min(currentQuestionIndex, unansweredQuestions.length - 1)
      ];
    }

    // Otherwise show the current question based on index
    return currentQuestionIndex < filteredQuestions.length
      ? filteredQuestions[currentQuestionIndex]
      : null;
  }, [
    filteredQuestions,
    unansweredQuestions,
    currentQuestionIndex,
    showOnlyUnanswered,
  ]);

  // Update answer state when current question changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.answer) {
      setAnswer(currentQuestion.answer);
    } else {
      setAnswer("");
    }
  }, [currentQuestion]);

  // Handle phase selection - optimized to avoid flicker
  const togglePhase = useCallback((phase: string) => {
    // Use React's useTransition to mark UI updates as transitions
    // This makes the UI feel more responsive by prioritizing rendering
    startTransition(() => {
      setSelectedPhases((prev) => {
        const phaseValue = phase.toLowerCase();
        // Toggle the phase selection
        if (prev.includes(phaseValue)) {
          return prev.filter((p) => p !== phaseValue);
        } else {
          return [...prev, phaseValue];
        }
      });

      // Reset to the first question matching the selected phases
      setCurrentQuestionIndex(0);
    });
  }, []);

  // Go to previous question
  const handleGoBack = () => {
    if (showOnlyUnanswered && unansweredQuestions.length > 0) {
      const currentIndex = unansweredQuestions.findIndex(
        (q) => q.id === currentQuestion?.id
      );
      if (currentIndex > 0) {
        // Find the index of the previous unanswered question in the filtered list
        const prevQuestion = unansweredQuestions[currentIndex - 1];
        const prevQuestionIndex = filteredQuestions.findIndex(
          (q) => q.id === prevQuestion.id
        );
        setCurrentQuestionIndex(prevQuestionIndex);
      }
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleGoToNext = () => {
    if (showOnlyUnanswered && unansweredQuestions.length > 0) {
      const currentIndex = unansweredQuestions.findIndex(
        (q) => q.id === currentQuestion?.id
      );
      if (currentIndex < unansweredQuestions.length - 1) {
        // Find the index of the next unanswered question in the filtered list
        const nextQuestion = unansweredQuestions[currentIndex + 1];
        const nextQuestionIndex = filteredQuestions.findIndex(
          (q) => q.id === nextQuestion.id
        );
        setCurrentQuestionIndex(nextQuestionIndex);
      }
    } else if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Return to product page
  const handleFinish = () => {
    router.push("/product");
  };

  // Save answer and move to next question - optimized for responsiveness
  const handleSaveAndContinue = async () => {
    if (!currentQuestion || !selectedProductId || !answer.trim()) return;

    setSaveStatus("saving");

    // Optimistic update - update the UI immediately
    const updatedAnswer = answer.trim();
    const currentQuestionId = currentQuestion.id;

    // Update local state with the answer immediately
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.id === currentQuestionId
          ? {
              ...q,
              answer: updatedAnswer,
              last_modified: new Date().toISOString(),
            }
          : q
      )
    );

    // Move to next question immediately for better responsiveness
    handleGoToNext();

    // Clear the answer field for the next question
    setAnswer("");

    // Reset save status after a very short delay - always back to idle (not success)
    setTimeout(() => setSaveStatus("idle"), 300);

    try {
      // Save answer to Firestore using server action (in background)
      const result = await saveQuestionAnswer(
        selectedProductId,
        currentQuestionId,
        updatedAnswer
      );

      if (!result.success) {
        // Only show error if the save fails
        setSaveStatus("error");
        console.error("Error saving answer:", result.error);

        // Wait a moment then reset
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
      // We're not changing state on success anymore, it just stays idle
    } catch (error) {
      setSaveStatus("error");
      console.error("Error saving answer:", error);

      // Wait a moment then reset
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  // Get phase statistics for the sidebar
  const phases = tagOptions.map((tag) => {
    const phaseValue = tag.value;
    const questionsInPhase = allQuestions.filter((q) =>
      (q.tags as string[]).includes(phaseValue)
    );

    const answeredInPhase = questionsInPhase.filter(
      (q) => q.answer && q.answer.trim() !== ""
    );

    return {
      value: phaseValue,
      label: tag.label,
      count: questionsInPhase.length,
      answeredCount: answeredInPhase.length,
    };
  });

  // Form schema for adding a new question
  const formSchema = z.object({
    text: z
      .string()
      .min(3, { message: "Question must be at least 3 characters long" })
      .max(500, { message: "Question must be less than 500 characters" }),
    phase: z.enum([
      "Discover",
      "Validate",
      "Design",
      "Build",
      "Secure",
      "Launch",
      "Grow",
    ]),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Form for adding a new question
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      phase: "Discover",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!selectedProductId) return;

    try {
      // Create the question in Firebase
      const response = await addProductQuestion(selectedProductId, {
        question: data.text,
        answer: null,
        tags: [data.phase.toLowerCase()],
      });

      if (response.success && response.id) {
        // Add the new question to local state
        const newQuestion: Question = {
          id: response.id,
          question: data.text,
          answer: null,
          tags: [data.phase.toLowerCase()],
          phase: data.phase,
          order: allQuestions.length + 1, // Place at the end
          last_modified: new Date(),
          createdAt: new Date(),
        };

        setAllQuestions((prev) => [...prev, newQuestion]);
      }

      form.reset();
      setModalOpen(false);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  // Function to create initial questions if needed
  const createInitialQuestions = async () => {
    if (!selectedProductId) return;

    setIsLoading(true);
    try {
      const result = await ensureProductQuestions(selectedProductId);
      if (result.success) {
        // Reload questions after creation
        const response = await getOrderedProductQuestions(selectedProductId);
        if (response.success && response.questions) {
          const loadedQuestions = response.questions.map((q: any) => {
            const phaseTag = (q.tags as string[])?.find((tag: string) =>
              [
                "discover",
                "validate",
                "design",
                "build",
                "secure",
                "launch",
                "grow",
              ].includes(tag)
            );

            return {
              ...q,
              phase:
                q.phase ||
                (phaseTag
                  ? phaseTag.charAt(0).toUpperCase() + phaseTag.slice(1)
                  : "Other"),
            };
          });

          setAllQuestions(loadedQuestions);
        }
      }
    } catch (error) {
      console.error("Error creating initial questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have questions, if not create them
  useEffect(() => {
    if (!isLoading && selectedProductId && allQuestions.length === 0) {
      createInitialQuestions();
    }
  }, [isLoading, selectedProductId, allQuestions.length]);

  // Memoize toggle handler to prevent recreating on each render
  const handleTogglePhase = useCallback((phase: string) => {
    togglePhase(phase);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading questions...</div>;
  }

  // Show a message and button if no questions exist
  if (!isLoading && allQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p>No questions found for this product.</p>
        <Button onClick={createInitialQuestions}>Create Questions</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left sidebar with phases */}
      <div className="w-64 flex-shrink-0">
        <h3 className="font-medium mb-4">Question Categories</h3>

        <div className="space-y-2">
          {phases.map((phase) => (
            <PhaseCategory
              key={phase.value}
              phase={phase}
              isSelected={selectedPhases.includes(phase.value)}
              onToggle={handleTogglePhase}
              answeredCount={phase.answeredCount}
              totalCount={phase.count}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 min-w-0 transition-opacity duration-150 ${isPending ? "opacity-70" : "opacity-100"}`}
      >
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Progress: {answeredFilteredQuestions.length} of{" "}
              {filteredQuestions.length} questions answered
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setShowOnlyUnanswered(!showOnlyUnanswered);
                  setCurrentQuestionIndex(0);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                {showOnlyUnanswered ? "Show All" : "Show Unanswered"}
              </Button>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          {filteredQuestions.length > 0 && currentQuestion && (
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>
                Question {getCurrentQuestionDisplayIndex()} of{" "}
                {filteredQuestions.length}
              </span>
              {unansweredQuestions.length > 0 && (
                <span>{unansweredQuestions.length} questions remaining</span>
              )}
            </div>
          )}
        </div>

        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            answer={answer}
            setAnswer={setAnswer}
            saveStatus={saveStatus}
            onSave={handleSaveAndContinue}
            onBack={handleGoBack}
            onFinish={handleFinish}
            canGoBack={currentQuestionIndex > 0}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {unansweredQuestions.length > 0
                  ? "Continue Answering Questions"
                  : "All Done!"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {unansweredQuestions.length > 0
                  ? `You have ${unansweredQuestions.length} unanswered questions. Click the button below to continue.`
                  : "You've answered all the questions. Your responses will help us generate better assets for your startup."}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleFinish}>Return to Product</Button>
              {unansweredQuestions.length > 0 && (
                <Button
                  onClick={() => {
                    setShowOnlyUnanswered(true);
                    setCurrentQuestionIndex(0);
                  }}
                  variant="outline"
                >
                  Continue Answering
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Custom Question
          </Button>
        </div>
      </div>

      {/* Add Question Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a custom question to answer for your product.
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
                        placeholder="Enter your question here"
                        className="min-h-24"
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
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Discover">Discover</SelectItem>
                        <SelectItem value="Validate">Validate</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Build">Build</SelectItem>
                        <SelectItem value="Secure">Secure</SelectItem>
                        <SelectItem value="Launch">Launch</SelectItem>
                        <SelectItem value="Grow">Grow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best fits your question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Add Question</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
