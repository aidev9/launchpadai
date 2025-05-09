import { atom } from "jotai";
import { Question } from "@/lib/firebase/schema";

// Create an atom to share all questions
export const allQuestionsAtom = atom<Question[]>([]);

// Create an atom to store the selected phases
export const selectedPhasesAtom = atom<string[]>(["All"]);

// Modal state atom for adding new questions
export const questionModalOpenAtom = atom(false);
