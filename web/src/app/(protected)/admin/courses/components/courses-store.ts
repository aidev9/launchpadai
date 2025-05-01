import { atom } from "jotai";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import type { Table } from "@tanstack/react-table";
import { Course } from "@/lib/firebase/schema";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "updatedAt", desc: true },
]);

// Table instance atom
export const tableInstanceAtom = atom<Table<Course> | null>(null);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const levelFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);

// Modal atoms
export const addCourseModalOpenAtom = atom<boolean>(false);
export const editCourseModalOpenAtom = atom<boolean>(false);
export const viewCourseModalOpenAtom = atom<boolean>(false);
export const selectedCourseAtom = atom<Course | null>(null);

// Course form atom - for storing form data during edit/create
export const courseFormDataAtom = atom<Partial<Course>>({});

// Define action types for course operations
export type CourseAction =
  | { type: "ADD"; course: Course }
  | { type: "UPDATE"; course: Course }
  | { type: "DELETE"; courseId: string }
  | { type: "DELETE_MANY"; courseIds: string[] }
  | { type: "LOAD"; courses: Course[] };

// Create a course action atom for targeted updates
export const courseActionAtom = atom<CourseAction | null>(null);

// Initial data fetch trigger
export const initialLoadAtom = atom(0);
