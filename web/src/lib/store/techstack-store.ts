import { atom } from "jotai";
import { Phases, TechStack, TechStackAsset } from "@/lib/firebase/schema";
import { Table, ColumnFiltersState, SortingState } from "@tanstack/react-table";

/**
 * TECH STACK MANAGEMENT STORE ATOMS
 *
 * These atoms are for managing collections of tech stacks in the stack management
 * UI (like /mystacks pages). They handle CRUD operations, table state, filtering, etc.
 *
 * DO NOT USE THESE FOR WIZARD FLOW - use /lib/atoms/product.ts instead.
 *
 * Used by:
 * - /mystacks pages and components
 * - Tech stack table and management UI
 * - Tech stack selection dropdowns in management pages
 */

// Layout view type
export type LayoutViewType = "card" | "table";
export const techStackLayoutViewAtom = atom<LayoutViewType>("card");

// Base data atoms
export const allTechStacksAtom = atom<TechStack[]>([]);
export const techStacksLoadingAtom = atom<boolean>(false);
export const techStacksErrorAtom = atom<string | null>(null);

// Filter atoms
export const techStackPhaseFilterAtom = atom<Phases[]>([]);
export const techStackSearchQueryAtom = atom<string>("");

// Derived atoms for filtered tech stacks
export const filteredTechStacksAtom = atom((get) => {
  const allTechStacks = get(allTechStacksAtom);
  const phaseFilter = get(techStackPhaseFilterAtom);
  const searchQuery = get(techStackSearchQueryAtom);

  let filtered = allTechStacks;

  // Apply phase filter
  if (phaseFilter.length > 0) {
    filtered = filtered.filter((stack) =>
      stack.phases.some((p) => phaseFilter.includes(p))
    );
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (stack) =>
        stack.name.toLowerCase().includes(query) ||
        stack.description?.toLowerCase().includes(query) ||
        stack.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Atom for current selected tech stack
export const selectedTechStackAtom = atom<TechStack | null>(null);
export const isEditModeAtom = atom<boolean>(false);

// Atom for persisting column visibility for the tech stack table
export const stackTableColumnVisibilityAtom = atom<Record<string, boolean>>({});

// Atoms for stack table state
export const stackTableSortingAtom = atom<SortingState>([]);
export const stackTableRowSelectionAtom = atom<Record<string, boolean>>({});

// Form state atoms for wizard
export const techStackWizardStateAtom = atom<TechStack>({
  id: "",
  appType: "",
  frontEndStack: "",
  backEndStack: "",
  databaseStack: "",
  aiAgentStack: [],
  integrations: [],
  deploymentStack: "",
  name: "",
  description: "",
  tags: [],
  phases: [],
  prompt: "",
  documentationLinks: [],
  productId: "",
  userId: "",
});

// Current step atom
export const currentWizardStepAtom = atom<number>(1);

// Table state atoms
export const techStackColumnFiltersAtom = atom<ColumnFiltersState>([]);
export const techStackSortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);

// Table instance atom
export const techStackTableInstanceAtom = atom<Table<TechStack> | null>(null);

// Optimistic update atoms for tech stack CRUD operations
export const updateTechStackAtom = atom(
  null,
  (get, set, updatedTechStack: TechStack) => {
    set(allTechStacksAtom, (prev) =>
      prev.map((stack) =>
        stack.id === updatedTechStack.id ? updatedTechStack : stack
      )
    );
  }
);

export const deleteTechStackAtom = atom(
  null,
  (get, set, techStackId: string) => {
    set(allTechStacksAtom, (prev) =>
      prev.filter((stack) => stack.id !== techStackId)
    );
  }
);

export const deleteMultipleTechStacksAtom = atom(
  null,
  (get, set, techStackIds: string[]) => {
    set(allTechStacksAtom, (prev) =>
      prev.filter((stack) => !techStackIds.includes(stack.id || ""))
    );
  }
);

export const addTechStackAtom = atom(
  null,
  (get, set, newTechStack: TechStack) => {
    set(allTechStacksAtom, (prev) => [...prev, newTechStack]);
  }
);

// Asset-related atoms
export const techStackAssetsAtom = atom<TechStackAsset[]>([]);
export const selectedAssetAtom = atom<TechStackAsset | null>(null);
export const selectedAssetIdAtom = atom<string | null>(null);

// Asset UI state atoms
export const assetsLoadingAtom = atom<boolean>(false);
export const assetsErrorAtom = atom<string | null>(null);
export const assetGeneratingAtom = atom<boolean>(false);
export const generatingAssetsAtom = atom<Record<string, boolean>>({});
export const activeTabAtom = atom<string>("general");
export const hasInsufficientCreditsAtom = atom<boolean>(false);

// Derived atoms for assets
export const filteredAssetsAtom = atom((get) => {
  const assets = get(techStackAssetsAtom);
  return assets;
});
