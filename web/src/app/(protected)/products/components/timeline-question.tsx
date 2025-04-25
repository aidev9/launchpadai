"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { answerProductQuestionAction } from "@/lib/firebase/actions/questions";
import { Lock, Unlock, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useXp } from "@/xp/useXp";

interface TimelineQuestionProps {
  productId: string;
  questionId: string;
  question: string;
  answer: string | null;
  onUnlock?: () => void;
}

export function TimelineQuestion({
  productId,
  questionId,
  question,
  answer,
  onUnlock,
}: TimelineQuestionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState(answer || "");
  const [isUnlocked, setIsUnlocked] = useState(!!answer);
  const router = useRouter();
  const { refreshXp } = useXp();

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast({
        title: "Please enter an answer",
        description:
          "Your timeline helps us provide better guidance for your startup journey.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await answerProductQuestionAction(
        productId,
        questionId,
        inputValue
      );

      if (result.success) {
        setIsUnlocked(true);

        // Refresh XP
        console.log("Timeline answer saved, refreshing XP...");
        refreshXp().catch((err) =>
          console.error("Failed to refresh XP after timeline answer:", err)
        );

        // Show success toast
        toast({
          title: "Timeline set!",
          description:
            "You've earned 5 XP and unlocked the Milestones feature!",
          variant: "default",
        });

        // Call onUnlock if provided
        if (onUnlock) {
          onUnlock();
        }
      } else {
        toast({
          title: "Error saving answer",
          description:
            result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving timeline answer:", error);
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className={`shadow-md transition-all ${isUnlocked ? "border-green-300" : "border-amber-300"}`}
    >
      <CardHeader
        className={
          isUnlocked
            ? "bg-green-50 dark:bg-green-900/20"
            : "bg-amber-50 dark:bg-amber-900/20"
        }
      >
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <Unlock className="h-5 w-5 text-green-600" />
          ) : (
            <Lock className="h-5 w-5 text-amber-600" />
          )}
          <CardTitle className="text-lg">
            {isUnlocked
              ? "Milestones Feature Unlocked"
              : "Unlock Milestones Feature"}
          </CardTitle>
        </div>
        <CardDescription>
          {isUnlocked
            ? "You've unlocked the Milestones feature to visualize your startup journey."
            : "Answer this question to earn 5 XP and unlock the Milestones feature."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="font-medium mb-3">{question}</p>
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your expected timeline..."
          className="resize-none"
          rows={3}
          disabled={isUnlocked}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        {isUnlocked ? (
          <Button
            variant="default"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => router.push(`/milestones?productId=${productId}`)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View Milestones
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !inputValue.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSubmitting ? "Saving..." : "Submit Answer & Unlock"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
