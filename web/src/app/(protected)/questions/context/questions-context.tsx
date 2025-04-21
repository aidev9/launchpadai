"use client";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import { Question } from "../data/schema";

// Dialog type definition
type QuestionsDialogType = "add" | "edit" | "delete" | "view";

// Create atoms for state
export const dialogOpenAtom = atom<QuestionsDialogType | null>(null);
export const currentQuestionAtom = atom<Question | null>(null);

// Utility hooks for easier atom access
export function useDialogOpen() {
  return useAtom(dialogOpenAtom);
}

export function useSetDialogOpen() {
  return useSetAtom(dialogOpenAtom);
}

export function useCurrentQuestion() {
  return useAtom(currentQuestionAtom);
}

export function useSetCurrentQuestion() {
  return useSetAtom(currentQuestionAtom);
}

// Combined hook for compatibility with existing code
export function useQuestions() {
  const [open, setOpen] = useAtom(dialogOpenAtom);
  const [currentQuestion, setCurrentQuestion] = useAtom(currentQuestionAtom);

  return {
    open,
    setOpen,
    currentQuestion,
    setCurrentQuestion,
  };
}

// Provider component is now a simple wrapper with no context
export default function QuestionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
