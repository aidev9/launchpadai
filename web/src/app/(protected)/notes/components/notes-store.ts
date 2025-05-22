import { atom } from "jotai";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import type { Table as TableInstance } from "@tanstack/react-table";
import { Phases } from "@/lib/firebase/schema";

// Define the Note type
export interface Note {
  id: string;
  note_body: string;
  phases: Phases[];
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
  productId?: string;
}

// View mode type
export type ViewMode = "grid" | "list";

// View mode atom
export const viewModeAtom = atom<ViewMode>("list");

// Table state atoms
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([]);
export const columnVisibilityAtom = atom<Record<string, boolean>>({});
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const searchFilterAtom = atom("");
export const tagsFilterAtom = atom<string[]>([]);
export const phaseFilterAtom = atom<string[]>([]);
export const searchQueryAtom = atom<string>("");

// Table instance atom
export const tableInstanceAtom = atom<TableInstance<Note> | null>(null);

// Modal state atoms
export const addNoteModalOpenAtom = atom(false);
export const editNoteModalOpenAtom = atom(false);
export const deleteNoteModalOpenAtom = atom(false);

// Selected note atom
export const selectedNoteAtom = atom<Note | null>(null);

// Notes data atom
export const allNotesAtom = atom<Note[]>([]);
