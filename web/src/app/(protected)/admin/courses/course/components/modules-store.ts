import { atom } from "jotai";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import type { Table } from "@tanstack/react-table";
import { Module } from "@/lib/firebase/schema";
import { modulesAtom } from "./modulesAtom";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([{ id: "title", desc: false }]);

// Table instance atom
export const tableInstanceAtom = atom<Table<Module> | null>(null);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const levelTagsAtom = atom<string[]>([
  "beginner",
  "intermediate",
  "advanced",
]);
export const tagsFilterAtom = atom<string[]>([]);

// Modal atoms
export const addModuleModalOpenAtom = atom<boolean>(false);
export const editModuleModalOpenAtom = atom<boolean>(false);
export const selectedModuleAtom = atom<Module | null>(null);

// Module form atom - for storing form data during edit/create
export const moduleFormDataAtom = atom<Partial<Module>>({});

// Define action types for module operations
export type ModuleAction =
  | { type: "ADD"; module: Module }
  | { type: "UPDATE"; module: Module }
  | { type: "DELETE"; moduleId: string }
  | { type: "DELETE_MANY"; moduleIds: string[] }
  | { type: "SET"; modules: Module[] };

// Create a module action atom for targeted updates
export const moduleActionAtom = atom<ModuleAction | null>(null);

// Initial data fetch trigger
export const initialLoadAtom = atom(0);

// Re-export modulesAtom for convenience
export { modulesAtom };
