"use client";

import { useSetAtom } from "jotai";
import { dialogOpenAtom } from "../context/questions-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function QuestionsPrimaryButtons() {
  const setOpen = useSetAtom(dialogOpenAtom);

  const handleAddClick = () => {
    setOpen("add");
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
