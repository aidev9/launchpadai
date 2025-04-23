"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAtom } from "jotai";
import { questionModalOpenAtom } from "@/lib/store/questions-store";

export function AddQuestionButton() {
  const [, setModalOpen] = useAtom(questionModalOpenAtom);

  const handleClick = () => {
    // Clear any editing state when adding a new question
    if (typeof window !== "undefined") {
      localStorage.removeItem("editingQuestionId");
    }

    // Open the modal without any console logs to reduce re-renders
    setModalOpen(true);
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      size="sm"
      className="flex items-center gap-1"
    >
      <Plus className="h-4 w-4" />
      <span>Add Question</span>
    </Button>
  );
}
