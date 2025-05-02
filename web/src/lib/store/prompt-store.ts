import { atom } from "jotai";
import { Prompt } from "@/lib/firebase/schema";
import { Table, ColumnFiltersState, SortingState } from "@tanstack/react-table";

// Base data atoms
export const allPromptsAtom = atom<Prompt[]>([]);
export const userPromptsAtom = atom<Prompt[]>([]);
export const promptsLoadingAtom = atom<boolean>(false);
export const promptsErrorAtom = atom<string | null>(null);

// Filter atoms
export const promptPhaseFilterAtom = atom<string[]>([]);
export const promptSearchQueryAtom = atom<string>("");

// Derived atoms for filtered prompts
export const filteredPromptsAtom = atom((get) => {
  const allPrompts = get(allPromptsAtom);
  const phaseFilter = get(promptPhaseFilterAtom);
  const searchQuery = get(promptSearchQueryAtom);

  let filtered = allPrompts;

  // Apply phase filter
  if (phaseFilter.length > 0) {
    filtered = filtered.filter((prompt) =>
      prompt.phaseTags.some((tag) => phaseFilter.includes(tag))
    );
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.body.toLowerCase().includes(query) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
});

export const filteredUserPromptsAtom = atom((get) => {
  const userPrompts = get(userPromptsAtom);
  const phaseFilter = get(promptPhaseFilterAtom);
  const searchQuery = get(promptSearchQueryAtom);

  let filtered = userPrompts;

  // Apply phase filter
  if (phaseFilter.length > 0) {
    filtered = filtered.filter((prompt) =>
      prompt.phaseTags.some((tag) => phaseFilter.includes(tag))
    );
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.body.toLowerCase().includes(query) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Atom for current selected prompt (used when navigating to detail view)
export const selectedPromptAtom = atom<Prompt | null>(null);

// Atom for storing the current prompt ID
export const selectedPromptIdAtom = atom<string | null>(null);

// Action types for prompt state management
export type PromptAction =
  | { type: "ADD"; prompt: Prompt }
  | { type: "UPDATE"; prompt: Prompt }
  | { type: "DELETE"; promptId: string }
  | { type: "DELETE_MANY"; promptIds: string[] }
  | { type: "LOAD"; prompts: Prompt[] }
  | null;

// Atom for managing prompt state actions
export const promptActionAtom = atom<PromptAction>(null);

// Atom for tracking if prompt modal is open
export const promptModalOpenAtom = atom<boolean>(false);

// Table state atoms
// Atom for tracking row selection in admin table
export const promptRowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<Record<string, boolean>>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);

// Atom for tracking if a new refresh is needed (toggle after seeding)
export const initialLoadAtom = atom<boolean>(false);

// Add an atom to store the prompt being edited
export const editedPromptAtom = atom<Prompt | null>(null);

// Table instance atom
export const tableInstanceAtom = atom<Table<Prompt> | null>(null);

// Filter atoms
export const titleFilterAtom = atom<string>("");
export const phaseTagsFilterAtom = atom<string[]>([]);
export const productTagsFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);

// // Modal atoms
// export const deletePromptModalOpenAtom = atom<boolean>(false);

// // Action types for prompt state management
// export type PromptAction =
//   | { type: "ADD"; prompt: Prompt }
//   | { type: "UPDATE"; prompt: Prompt }
//   | { type: "DELETE"; promptId: string }
//   | { type: "DELETE_MANY"; promptIds: string[] }
//   | { type: "LOAD"; prompts: Prompt[] }
//   | null;
