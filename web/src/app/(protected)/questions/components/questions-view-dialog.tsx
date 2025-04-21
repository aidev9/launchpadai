"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuestions } from "../context/questions-context";

export function QuestionsViewDialog() {
  const { open, setOpen, currentQuestion } = useQuestions();

  const isOpen = open === "view";

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen(null)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>View Question</DialogTitle>
          <DialogDescription>
            Detailed information about this question.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-medium text-base">Question</h3>
            <p className="mt-1 text-muted-foreground">
              {currentQuestion?.question}
            </p>
          </div>

          {currentQuestion?.answer ? (
            <div>
              <h3 className="font-medium text-base">Answer</h3>
              <p className="mt-1 text-muted-foreground">
                {currentQuestion.answer}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-base">Answer</h3>
              <p className="mt-1 text-muted-foreground italic">
                No answer provided yet
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-base">Project</h3>
            <p className="mt-1 text-muted-foreground">
              {currentQuestion?.project_id}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-base">Tags</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {currentQuestion?.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-base">Last Modified</h3>
            <p className="mt-1 text-muted-foreground">
              {currentQuestion?.last_modified.toLocaleDateString()} at{" "}
              {currentQuestion?.last_modified.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
