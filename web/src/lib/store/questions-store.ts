import { atom } from "jotai";

// Define the question type
export interface Question {
  id: string;
  question: string;
  answer: string | null;
  tags: string[];
  order: number;
  phase?: string;
  last_modified: Date | string;
  createdAt: Date | string;
}

// Create an atom to share all questions
export const allQuestionsAtom = atom<Question[]>([]);

// Create an atom to store the selected phases
export const selectedPhasesAtom = atom<string[]>(["All"]);

// Modal state atom for adding new questions
export const questionModalOpenAtom = atom(false);
