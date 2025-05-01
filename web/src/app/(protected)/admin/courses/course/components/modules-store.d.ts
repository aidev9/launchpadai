declare module "modules-store" {
  import { atom } from "jotai";
  import type {
    ColumnFiltersState,
    SortingState,
    Table,
  } from "@tanstack/react-table";
  import type { Module } from "@/lib/firebase/schema";

  // Table state atoms
  export const rowSelectionAtom: ReturnType<
    typeof atom<Record<string, boolean>>
  >;
  export const columnVisibilityAtom: ReturnType<
    typeof atom<Record<string, boolean>>
  >;
  export const columnFiltersAtom: ReturnType<typeof atom<ColumnFiltersState>>;
  export const sortingAtom: ReturnType<typeof atom<SortingState>>;

  // Table instance atom
  export const tableInstanceAtom: ReturnType<typeof atom<Table<Module> | null>>;

  // Filter atoms
  export const searchFilterAtom: ReturnType<typeof atom<string>>;
  export const levelTagsAtom: ReturnType<typeof atom<string[]>>;
  export const tagsFilterAtom: ReturnType<typeof atom<string[]>>;

  // Modal atoms
  export const addModuleModalOpenAtom: ReturnType<typeof atom<boolean>>;
  export const editModuleModalOpenAtom: ReturnType<typeof atom<boolean>>;
  export const selectedModuleAtom: ReturnType<typeof atom<Module | null>>;

  // Module form atom
  export const moduleFormDataAtom: ReturnType<typeof atom<Partial<Module>>>;

  // Module action types and atom
  export type ModuleAction =
    | { type: "ADD"; module: Module }
    | { type: "UPDATE"; module: Module }
    | { type: "DELETE"; moduleId: string }
    | { type: "DELETE_MANY"; moduleIds: string[] }
    | { type: "SET"; modules: Module[] };

  export const moduleActionAtom: ReturnType<typeof atom<ModuleAction | null>>;
  export const initialLoadAtom: ReturnType<typeof atom<number>>;

  // Modules state
  export const modulesAtom: ReturnType<typeof atom<Module[]>>;
}
