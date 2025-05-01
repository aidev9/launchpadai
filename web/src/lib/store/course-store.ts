import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Course } from "@/lib/firebase/schema";

// Atom to store the selected course
export const selectedCourseAtom = atomWithStorage<Course | null>(
  "selectedCourse",
  null
);

// Atom to update the selected course
export const setSelectedCourseAtom = atom(
  null,
  (_, set, course: Course | null) => {
    set(selectedCourseAtom, course);
  }
);
