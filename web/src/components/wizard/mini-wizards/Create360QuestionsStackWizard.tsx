import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import { clientAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { productAtom } from "@/lib/atoms/product";
import { globalWizardStepAtom } from "@/lib/atoms/wizard";
import { questions } from "@/app/(protected)/answer_questions/data/questions";
import { Phases } from "@/lib/firebase/schema";
import { firebaseQA } from "@/lib/firebase/client/FirebaseQA";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { getDocs } from "firebase/firestore";

// Define the props interface for this component
interface Create360QuestionsStackWizardProps {
  _onBack?: () => void;
  onComplete?: (data: { answeredQuestions: number }) => void;
}

// Define the 7 phases for the 360 questions wizard
const QUESTION_PHASES = [
  {
    phase: Phases.DISCOVER,
    name: "Discover",
    description: "Understanding your market and users",
  },
  {
    phase: Phases.VALIDATE,
    name: "Validate",
    description: "Validating your product concept",
  },
  {
    phase: Phases.DESIGN,
    name: "Design",
    description: "Designing your user experience",
  },
  {
    phase: Phases.BUILD,
    name: "Build",
    description: "Technical development planning",
  },
  {
    phase: Phases.SECURE,
    name: "Secure",
    description: "Security and compliance considerations",
  },
  {
    phase: Phases.LAUNCH,
    name: "Launch",
    description: "Go-to-market strategy",
  },
  {
    phase: Phases.GROW,
    name: "Grow",
    description: "Scaling and growth strategies",
  },
] as const;

// Group questions by phase
const getQuestionsByPhase = () => {
  return QUESTION_PHASES.map(({ phase }) => {
    return questions.filter((q) => q.phases.includes(phase as any));
  });
};

const questionsByPhase = getQuestionsByPhase();

export default function Create360QuestionsStackWizard({
  _onBack,
  onComplete,
}: Create360QuestionsStackWizardProps) {
  const [user] = useAuthState(clientAuth);
  const [product] = useAtom(productAtom);
  const [globalStep] = useAtom(globalWizardStepAtom);
  const { toast } = useToast();

  // Get current step from global state (questions is mainStep 4, so subStep is the current step)
  const [mainStep, subStep] = globalStep;
  const currentStep = mainStep === 4 ? subStep : 1; // Only show content if we're in questions wizard

  // State for answers - using a Map with question ID as key
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate step range
  const validatedStep = Math.max(1, Math.min(7, currentStep));
  const currentPhase = QUESTION_PHASES[validatedStep - 1];
  const currentPhaseQuestions = questionsByPhase[validatedStep - 1] || [];

  // Load existing answers from Firebase on mount
  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (!user?.uid || !product?.id) return;

      setIsLoading(true);
      try {
        // Get existing questions for this product
        const questionsQuery = firebaseQA.getQuestionsByProduct(product.id);
        if (questionsQuery) {
          // Use getDocs to fetch the documents
          const snapshot = await getDocs(questionsQuery);

          if (snapshot && !snapshot.empty) {
            const existingAnswers = new Map<string, string>();

            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (data.question && data.answer) {
                // Find the question ID by matching the question text
                const matchingQuestion = questions.find(
                  (q) => q.text === data.question
                );
                if (matchingQuestion) {
                  existingAnswers.set(matchingQuestion.id, data.answer);
                }
              }
            });

            if (existingAnswers.size > 0) {
              console.log(
                `[QuestionsWizard] Loaded ${existingAnswers.size} existing answers`
              );
              setAnswers(existingAnswers);
            }
          }
        }
      } catch (error) {
        console.error("Error loading existing answers:", error);
        // Continue with empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAnswers();
  }, [user?.uid, product?.id]);

  // Update answer for a specific question
  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      if (answer.trim()) {
        newAnswers.set(questionId, answer);
      } else {
        newAnswers.delete(questionId);
      }
      return newAnswers;
    });
  };

  // Auto-save current step answers to Firebase
  const saveCurrentStepAnswers = React.useCallback(async () => {
    if (!user?.uid || !product?.id) {
      console.log("[QuestionsWizard] No user or product, skipping save");
      return;
    }

    try {
      // Get answers for current step questions
      const currentStepAnswers = currentPhaseQuestions
        .map((question) => {
          const answer = answers.get(question.id);
          if (!answer || !answer.trim()) return null;

          return {
            question: question.text,
            answer: answer,
            phases: question.phases.map((phase) => {
              // Convert string phases to Phases enum
              switch (phase) {
                case "Discover":
                  return Phases.DISCOVER;
                case "Validate":
                  return Phases.VALIDATE;
                case "Design":
                  return Phases.DESIGN;
                case "Build":
                  return Phases.BUILD;
                case "Secure":
                  return Phases.SECURE;
                case "Launch":
                  return Phases.LAUNCH;
                case "Grow":
                  return Phases.GROW;
                default:
                  return Phases.DISCOVER;
              }
            }),
            tags: [
              `step-${validatedStep}`,
              currentPhase.name.toLowerCase(),
              "wizard-360",
            ],
            userId: user.uid,
            productId: product.id,
          };
        })
        .filter(Boolean);

      if (currentStepAnswers.length > 0) {
        // First, try to get existing questions to avoid duplicates
        const existingQuery = firebaseQA.getQuestionsByProduct(product.id);
        const existingQuestions: Set<string> = new Set();

        if (existingQuery) {
          try {
            const existingSnapshot = await getDocs(existingQuery);
            existingSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (data.question) {
                existingQuestions.add(data.question);
              }
            });
          } catch (_error) {
            console.log(
              "[QuestionsWizard] Could not check existing questions, proceeding with save"
            );
          }
        }

        // Filter out questions that already exist
        const newQuestions = currentStepAnswers.filter(
          (q): q is NonNullable<typeof q> =>
            q !== null && !existingQuestions.has(q.question)
        );

        if (newQuestions.length > 0) {
          const result = await firebaseQA.createBulkQuestions(
            product.id,
            newQuestions as any // TODO: Fix typing
          );

          if (result.success) {
            console.log(
              `[QuestionsWizard] Saved ${result.count} new answers for step ${validatedStep}`
            );
          } else {
            console.error(
              "[QuestionsWizard] Failed to save answers:",
              result.error
            );
          }
        } else {
          console.log(
            `[QuestionsWizard] No new answers to save for step ${validatedStep}`
          );
        }
      }
    } catch (error) {
      console.error("[QuestionsWizard] Error saving step answers:", error);
    }
  }, [
    user?.uid,
    product?.id,
    currentPhaseQuestions,
    answers,
    validatedStep,
    currentPhase,
  ]);

  // Handle final submission (save all remaining answers)
  const handleFinalSubmit = React.useCallback(async () => {
    if (!user?.uid || !product?.id) {
      toast({
        title: "Error",
        description: "User or product not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save current step first
      await saveCurrentStepAnswers();

      toast({
        title: "Questions Saved!",
        description: `Successfully completed the 360° questions wizard.`,
      });

      if (onComplete) {
        onComplete({ answeredQuestions: answers.size });
      }
    } catch (error) {
      console.error("Error in final submission:", error);
      toast({
        title: "Error",
        description: "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user?.uid,
    product?.id,
    saveCurrentStepAnswers,
    toast,
    onComplete,
    answers.size,
  ]);

  // Expose navigation functions to parent component
  React.useEffect(() => {
    const wizard = {
      handleFinalSubmit,
      canGoNext: () => true, // Always allow navigation
      isLastStep: () => validatedStep === 7,
      onNavigateToNext: async () => {
        // Auto-save when navigating to next step
        await saveCurrentStepAnswers();
      },
    };

    // Store wizard functions globally so MainWizard can access them
    (window as any).currentQuestionsWizard = wizard; // TODO: Fix typing
  }, [validatedStep, handleFinalSubmit, saveCurrentStepAnswers]);

  // Calculate overall progress
  const totalProgress = (answers.size / 35) * 100;
  const currentStepAnswered = currentPhaseQuestions.filter(
    (q) => answers.has(q.id) && answers.get(q.id)!.trim().length > 0
  ).length;

  // Don't render if we're not in the questions wizard (mainStep 4)
  if (mainStep !== 4) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {QUESTION_PHASES.map((phase, index) => (
            <div key={phase.phase} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 === validatedStep
                    ? "bg-blue-600 text-white"
                    : index + 1 < validatedStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1 < validatedStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < QUESTION_PHASES.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Step {validatedStep}: {currentPhase.name} Phase
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentPhase.description}. All questions are optional - your answers
          are automatically saved as you go.
        </p>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Phase Progress</span>
            <span>
              {currentStepAnswered}/{currentPhaseQuestions.length} questions
            </span>
          </div>
          <Progress
            value={(currentStepAnswered / currentPhaseQuestions.length) * 100}
            className="h-2"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{answers.size}/35 questions</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </div>

      {/* Questions for current phase */}
      <div className="space-y-4">
        {currentPhaseQuestions.map((question, index) => {
          const hasAnswer =
            answers.has(question.id) &&
            answers.get(question.id)!.trim().length > 0;

          return (
            <div key={question.id} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  {hasAnswer ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor={`question-${question.id}`}
                    className="text-sm font-medium"
                  >
                    {index + 1}. {question.text}
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    placeholder="Type your answer here... (optional)"
                    value={answers.get(question.id) || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase completion status */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm">
            {currentPhase.name} phase ready! Your answers are automatically
            saved.
          </span>
        </div>
      </div>

      {/* Final submission button for last step */}
      {validatedStep === 7 && (
        <div className="pt-4 border-t">
          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? "Completing Wizard..."
              : "Complete Questions Wizard"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Complete the 360° questions wizard and continue to the next step.
          </p>
        </div>
      )}
    </div>
  );
}
