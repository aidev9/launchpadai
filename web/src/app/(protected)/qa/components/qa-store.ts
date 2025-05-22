import { atom } from "jotai";
import { Question, Phases } from "@/lib/firebase/schema";
import { Table, ColumnFiltersState, SortingState } from "@tanstack/react-table";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<Record<string, boolean>>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);

// All questions atom
export const allQuestionsAtom = atom<Question[]>([]);

// Table instance atom (will hold a reference to the TanStack Table instance)
export const tableInstanceAtom = atom<Table<Question> | null>(null);

// Filter atoms
export const searchQueryAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);
export const questionsPhaseFilterAtom = atom<Phases[]>([]);

// View mode atom
export const viewModeAtom = atom<"grid" | "table">("table");

// Modal state atoms
export const addQAModalOpenAtom = atom<boolean>(false);
export const editQAModalOpenAtom = atom<boolean>(false);
export const deleteQAModalOpenAtom = atom<boolean>(false);
export const selectedQuestionAtom = atom<Question | null>(null);
