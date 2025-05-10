import { atom } from "jotai";
import { SortingState } from "@tanstack/react-table";
import { Feature } from "../firebase/schema";

// Feature wizard state atoms
export const currentFeatureWizardStepAtom = atom<number>(1);
export const featureWizardStateAtom = atom<{
  productId: string;
  name: string;
  description: string;
  status: string;
  tags: string[];
}>({
  productId: "",
  name: "",
  description: "",
  status: "Draft",
  tags: [],
});

// Feature selection atoms
export const selectedFeatureIdAtom = atom<string | null>(null);
export const isEditModeAtom = atom<boolean>(false);
export const selectedFeatureAtom = atom<Feature | null>(null);

// Table state atoms
export const featureTableColumnVisibilityAtom = atom<Record<string, boolean>>(
  {}
);
export const featureTableSortingAtom = atom<SortingState>([]);
export const featureTableRowSelectionAtom = atom<Record<string, boolean>>({});

// View preference atom
export const featureViewModeAtom = atom<"grid" | "table">("table");

// Feature count atom
export const featureCountAtom = atom<number>(0);
export const featureCountLoadedAtom = atom<boolean>(false);
