import { atom } from "jotai";
import { Feedback } from "@/lib/firebase/schema";
import { Table } from "@tanstack/react-table";

// Atom for selected feedback item
export const selectedFeedbackAtom = atom<Feedback | null>(null);

// Atom for row selection in the feedback table
export const rowSelectionAtom = atom<Record<string, boolean>>({});

// Atom for column filters in the feedback table
export const columnFiltersAtom = atom<any[]>([]);

// Atom for column visibility in the feedback table
export const columnVisibilityAtom = atom<Record<string, boolean>>({});

// Atom for sorting in the feedback table
export const sortingAtom = atom<any[]>([]);

// Atom for table instance
export const tableInstanceAtom = atom<Table<Feedback> | null>(null);

// Atom for search filter
export const searchFilterAtom = atom<string>("");

// Atom for type filter
export const typeFilterAtom = atom<string[]>([]);

// Atom for status filter
export const statusFilterAtom = atom<string[]>([]);

// Atom for feedback action
export const feedbackActionAtom = atom<{
  type: "ADD" | "UPDATE" | "DELETE" | "DELETE_MANY" | "LOAD";
  feedback?: Feedback;
  feedbackId?: string;
  feedbackIds?: string[];
  feedbacks?: Feedback[];
} | null>(null);

// Atom for initial load
export const initialLoadAtom = atom<boolean>(true);

// Atom for feedback form data
export const feedbackFormDataAtom = atom<Feedback | null>(null);

// Atom for add feedback modal
export const addFeedbackModalOpenAtom = atom<boolean>(false);

// Atom for edit feedback modal
export const editFeedbackModalOpenAtom = atom<boolean>(false);

// Atom for respond feedback modal
export const respondFeedbackModalOpenAtom = atom<boolean>(false);
