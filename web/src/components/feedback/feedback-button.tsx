"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconMessages } from "@tabler/icons-react";
import { FeedbackModal } from "@/app/(protected)/help/components/feedback-modal";
import { useCreateFeedback } from "@/hooks/useFeedback";
import { FeedbackInput } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useXpMutation } from "@/xp/useXpMutation";

// Create a new QueryClient instance for this component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export function FeedbackButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "bug" | "feature" | "comment"
  >("feature");

  const handleOpenFeedback = () => {
    setFeedbackType("feature");
    setModalOpen(true);
  };

  // Add event listener for the custom openFeedback event
  useEffect(() => {
    const handleOpenFeedbackEvent = () => {
      handleOpenFeedback();
    };

    document.addEventListener("openFeedback", handleOpenFeedbackEvent);

    return () => {
      document.removeEventListener("openFeedback", handleOpenFeedbackEvent);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackButtonInner
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        feedbackType={feedbackType}
        handleOpenFeedback={handleOpenFeedback}
      />
    </QueryClientProvider>
  );
}

function FeedbackButtonInner({
  modalOpen,
  setModalOpen,
  feedbackType,
  handleOpenFeedback,
}: {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  feedbackType: "bug" | "feature" | "comment";
  handleOpenFeedback: () => void;
}) {
  const createFeedbackMutation = useCreateFeedback();
  const { toast } = useToast();
  const [userProfile] = useAtom(userProfileAtom);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  const handleSubmitFeedback = async (data: FeedbackInput) => {
    try {
      const userId = userProfile?.uid || "unknown";
      const userEmail = userProfile?.email || "unknown@example.com";

      await createFeedbackMutation.mutateAsync({
        data,
        userId,
        userEmail,
      });

      // Award XP for submitting feedback in background
      xpMutation.mutate("submit_feedback");

      // Show success toast with XP award
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! +25 XP",
        duration: 5000,
      });

      setModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpenFeedback}
        className="relative shadow-none border-0"
      >
        <IconMessages className="h-5 w-5" />
        <span className="sr-only">Feedback</span>
      </Button>
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={feedbackType}
        onSubmit={handleSubmitFeedback}
        isSubmitting={createFeedbackMutation.isPending}
      />
    </>
  );
}
