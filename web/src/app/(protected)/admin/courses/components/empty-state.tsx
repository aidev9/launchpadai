"use client";

import { useSetAtom } from "jotai";
import { Book, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedCoursesButton } from "./seed-courses-button";
import { addCourseModalOpenAtom } from "./courses-store";

export function EmptyState() {
  const setAddCourseModalOpen = useSetAtom(addCourseModalOpenAtom);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-[400px]">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Book className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No courses found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        You haven't added any courses yet. Get started by adding your first
        course or add sample data to see how it works.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => setAddCourseModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
        <SeedCoursesButton />
      </div>
    </div>
  );
}
