"use client";
import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";
import { Question } from "../data/schema";

type QuestionsDialogType = "add" | "edit" | "delete" | "view";

interface QuestionsContextType {
  open: QuestionsDialogType | null;
  setOpen: (str: QuestionsDialogType | null) => void;
  currentQuestion: Question | null;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
}

const QuestionsContext = React.createContext<QuestionsContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export default function QuestionsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<QuestionsDialogType>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  return (
    <QuestionsContext.Provider
      value={{ open, setOpen, currentQuestion, setCurrentQuestion }}
    >
      {children}
    </QuestionsContext.Provider>
  );
}

export const useQuestions = () => {
  const questionsContext = React.useContext(QuestionsContext);

  if (!questionsContext) {
    throw new Error("useQuestions has to be used within <QuestionsContext>");
  }

  return questionsContext;
};
