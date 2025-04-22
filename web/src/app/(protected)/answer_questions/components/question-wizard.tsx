"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom, atom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import {
  questions,
  Question,
  getQuestionsByPhase,
  getRandomUnansweredQuestion,
} from "../data/questions";
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
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Check,
} from "lucide-react";
import { saveQuestionAnswer } from "@/lib/firebase/questions";
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
import { createQuestion } from "@/lib/firebase/questions";
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

// Modal state
export const questionModalOpenAtom = atom<boolean>(false);

export function QuestionWizard() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [questionsHistory, setQuestionsHistory] = useState<Question[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useAtom(questionModalOpenAtom);

  const router = useRouter();

  // Calculate progress
  const progress = Math.floor(
    (answeredQuestions.length / questions.length) * 100
  );

  // Load answered questions from Firestore on component mount
  useEffect(() => {
    const loadAnsweredQuestions = async () => {
      // TODO: In a real implementation, fetch answered questions from Firestore
      // For now, we'll use localStorage to simulate persistence
      const saved = localStorage.getItem(
        `answeredQuestions_${selectedProductId}`
      );
      if (saved) {
        setAnsweredQuestions(JSON.parse(saved));
      }
    };

    if (selectedProductId) {
      loadAnsweredQuestions();
    }
  }, [selectedProductId]);

  // Select a random unanswered question when component mounts or after answering
  useEffect(() => {
    if (answeredQuestions.length < questions.length) {
      // Filter by selected phases if any are selected
      let filteredQuestions = questions;
      if (selectedPhases.length > 0) {
        filteredQuestions = questions.filter((q) =>
          selectedPhases.includes(q.phase.toLowerCase())
        );
      }

      const nextQuestion = getRandomUnansweredQuestion(
        answeredQuestions,
        filteredQuestions
      );

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        // Initialize questionsHistory with the first question if it's empty
        if (questionsHistory.length === 0) {
          setQuestionsHistory([nextQuestion]);
          setQuestionIndex(0);
        }
      } else {
        // If no questions in selected phases, get from all phases
        const anyQuestion = getRandomUnansweredQuestion(answeredQuestions);
        if (anyQuestion) {
          setCurrentQuestion(anyQuestion);
          // Initialize questionsHistory with the first question if it's empty
          if (questionsHistory.length === 0) {
            setQuestionsHistory([anyQuestion]);
            setQuestionIndex(0);
          }
        } else {
          setCurrentQuestion(null);
        }
      }
    } else {
      setCurrentQuestion(null);
    }
  }, [answeredQuestions, selectedPhases, questionsHistory.length]);

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedProductId || !answer.trim()) return;

    setIsSubmitting(true);
    setSaveStatus("saving");

    try {
      // In a real implementation, save to Firestore
      await saveQuestionAnswer(
        selectedProductId,
        currentQuestion.id,
        answer.trim(),
        currentQuestion.phase
      );

      // Update local state
      const newAnsweredQuestions = [...answeredQuestions, currentQuestion.id];
      setAnsweredQuestions(newAnsweredQuestions);

      // Save to localStorage for persistence between sessions
      localStorage.setItem(
        `answeredQuestions_${selectedProductId}`,
        JSON.stringify(newAnsweredQuestions)
      );

      // Clear answer for next question
      setAnswer("");
      setSaveStatus("success");

      // Auto-select next question
      setTimeout(() => {
        // Filter by selected phases if any are selected
        let filteredQuestions = questions;
        if (selectedPhases.length > 0) {
          filteredQuestions = questions.filter((q) =>
            selectedPhases.includes(q.phase.toLowerCase())
          );
        }

        const nextQuestion = getRandomUnansweredQuestion(
          newAnsweredQuestions,
          filteredQuestions
        );

        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          // Add the new question to history and move index forward
          setQuestionsHistory((prev) => [...prev, nextQuestion]);
          setQuestionIndex((prev) => prev + 1);
        } else {
          // If no questions in selected phases, get from all phases
          const anyQuestion = getRandomUnansweredQuestion(newAnsweredQuestions);
          if (anyQuestion) {
            setCurrentQuestion(anyQuestion);
            // Add the new question to history and move index forward
            setQuestionsHistory((prev) => [...prev, anyQuestion]);
            setQuestionIndex((prev) => prev + 1);
          } else {
            setCurrentQuestion(null);
          }
        }
        setSaveStatus("idle");
      }, 1000);
    } catch (error) {
      console.error("Error saving answer:", error);
      setSaveStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (questionIndex > 0) {
      const prevQuestion = questionsHistory[questionIndex - 1];
      setCurrentQuestion(prevQuestion);
      setQuestionIndex(questionIndex - 1);

      // Load the previous answer if it exists
      // In a real implementation, this would fetch from Firestore
      setAnswer(""); // Reset the answer for now
    }
  };

  const handleFinish = () => {
    router.push("/product");
  };

  const togglePhase = (phase: string) => {
    setSelectedPhases((prev) => {
      const phaseValue = phase.toLowerCase();
      if (prev.includes(phaseValue)) {
        return prev.filter((p) => p !== phaseValue);
      } else {
        return [...prev, phaseValue];
      }
    });
  };

  // Get all unique phases
  const phases = tagOptions.map((tag) => ({
    value: tag.value,
    label: tag.label,
    count: questions.filter((q) => q.phase.toLowerCase() === tag.value).length,
    answeredCount: questions.filter(
      (q) =>
        q.phase.toLowerCase() === tag.value && answeredQuestions.includes(q.id)
    ).length,
  }));

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

  // Form for adding a new question
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      phase: "Discover",
    },
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedProductId) {
      return;
    }

    try {
      // Generate a unique ID for the question
      const questionId = `custom_${Date.now()}`;

      // Create the question
      await createQuestion({
        question: data.text,
        project_id: selectedProductId,
        tags: [data.phase.toLowerCase()],
      });

      form.reset();
      setModalOpen(false);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left sidebar with phases */}
      <div className="w-64 flex-shrink-0">
        <h3 className="font-medium mb-4">Question Categories</h3>
        <div className="space-y-2">
          {phases.map((phase) => (
            <div
              key={phase.value}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                selectedPhases.includes(phase.value)
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              }`}
              onClick={() => togglePhase(phase.value)}
            >
              <div className="flex items-center">
                {selectedPhases.includes(phase.value) && (
                  <Check className="h-4 w-4 mr-2 text-primary" />
                )}
                <span className="font-medium">{phase.label}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {phase.answeredCount}/{phase.count}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-6 flex items-center gap-1"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Progress: {answeredQuestions.length} of {questions.length}{" "}
              questions answered
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {currentQuestion ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentQuestion.text}</span>
                <Badge variant="outline" className="ml-4">
                  {currentQuestion.phase}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFinish}>
                  Finish Later
                </Button>
                {questionIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || isSubmitting}
                className="flex items-center gap-2"
              >
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "success" && (
                  <>
                    Saved <CheckCircle className="h-4 w-4" />
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    Error <AlertCircle className="h-4 w-4" />
                  </>
                )}
                {saveStatus === "idle" && (
                  <>
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Done!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You've answered all the questions. Your responses will help us
                generate better assets for your startup.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinish}>Return to Product</Button>
            </CardFooter>
          </Card>
        )}
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
