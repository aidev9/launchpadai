"use client";

import { useState } from "react";
import { HelpHero } from "./components/help-hero";
import { FeedbackCards } from "./components/feedback-cards";
import { FeedbackModal } from "./components/feedback-modal";
import { useCreateFeedback } from "@/hooks/useFeedback";
import { FeedbackInput } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";

export default function HelpPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "bug" | "feature" | "comment"
  >("bug");

  const createFeedbackMutation = useCreateFeedback();
  const { toast } = useToast();
  const [userProfile] = useAtom(userProfileAtom);

  const handleOpenModal = (type: "bug" | "feature" | "comment") => {
    setFeedbackType(type);
    setModalOpen(true);
  };

  const handleSubmitFeedback = async (data: FeedbackInput) => {
    try {
      const userId = userProfile?.uid || "anonymous";
      const userEmail = userProfile?.email || "anonymous@example.com";

      await createFeedbackMutation.mutateAsync({
        data,
        userId,
        userEmail,
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
    <div className="container mx-auto py-8 px-4">
      <HelpHero />
      <FeedbackCards onCardClick={handleOpenModal} />
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={feedbackType}
        onSubmit={handleSubmitFeedback}
        isSubmitting={createFeedbackMutation.isPending}
      />
    </div>
  );
}
