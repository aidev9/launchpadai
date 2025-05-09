"use client";

import { useState, useEffect } from "react";
import { useRespondToFeedback } from "@/hooks/useFeedback";
import { Feedback } from "@/lib/firebase/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RespondDialogProps {
  feedback: Feedback | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RespondDialog({
  feedback,
  open,
  onOpenChange,
}: RespondDialogProps) {
  const [response, setResponse] = useState(feedback?.response || "");
  const respondMutation = useRespondToFeedback();

  // Update response when feedback changes
  useEffect(() => {
    if (feedback) {
      setResponse(feedback.response || "");
    }
  }, [feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback) return;

    await respondMutation.mutateAsync({
      id: feedback.id,
      response,
    });

    onOpenChange(false);
  };

  if (!feedback) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              Send a response to the user regarding their feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <div className="font-medium">{feedback.subject}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Original Message</Label>
              <div className="text-sm text-muted-foreground border p-3 rounded-md bg-muted/50">
                {feedback.body}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={respondMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={respondMutation.isPending}>
              {respondMutation.isPending ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
