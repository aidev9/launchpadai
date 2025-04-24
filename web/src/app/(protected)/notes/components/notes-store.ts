import { atom } from "jotai";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import type { Table as TableInstance } from "@tanstack/react-table";

// Define the Note type
export interface Note {
  id: string;
  note_body: string;
  tags: string[];
  last_modified: string;
}

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([]);

// Table instance atom
export const tableInstanceAtom = atom<TableInstance<Note> | null>(null);

// Filter atoms
export const searchFilterAtom = atom("");
export const dateFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);
