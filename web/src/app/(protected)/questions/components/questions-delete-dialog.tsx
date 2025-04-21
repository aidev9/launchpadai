"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteQuestion } from "@/lib/firebase/questions";
import { useToast } from "@/components/ui/use-toast";
import { useQuestions } from "../context/questions-context";

export function QuestionsDeleteDialog() {
  const { open, setOpen, currentQuestion, setCurrentQuestion } = useQuestions();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isOpen = open === "delete";

  const handleCancel = () => {
    setOpen(null);
  };

  const handleDelete = () => {
    if (!currentQuestion) return;

    startTransition(async () => {
      try {
        const response = await deleteQuestion(currentQuestion.id);

        if (response.success) {
          toast({
            title: "Success",
            description: "Question deleted successfully",
          });
          setOpen(null);
          setCurrentQuestion(null);
        } else {
          toast({
            title: "Error",
            description: `Failed to delete question: ${response.error}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Question</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">Question:</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentQuestion?.question}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
