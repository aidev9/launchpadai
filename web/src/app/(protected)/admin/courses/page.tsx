"use client";

import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course, getAllCourses } from "@/lib/firebase/courses";
import { columns } from "./components/courses-columns";
import { CoursesTable } from "./components/courses-table";
import { CourseForm } from "./components/course-form";
import { EmptyState } from "./components/empty-state";
import { addCourseModalOpenAtom } from "./components/courses-store";
import { useToast } from "@/hooks/use-toast";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const setAddCourseModalOpen = useSetAtom(addCourseModalOpenAtom);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const result = await getAllCourses();

        if (result.success) {
          setCourses(result.courses || []);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load courses",
            variant: "destructive",
          });
          setCourses([]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [toast]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">
            Manage your courses and track their performance
          </p>
        </div>
        {courses.length > 0 && (
          <Button onClick={() => setAddCourseModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        )}
      </div>

      <div className="-mx-4 mt-4 flex-1 overflow-auto px-4 py-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : courses.length > 0 ? (
          <CoursesTable columns={columns} data={courses} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Course form modals */}
      <CourseForm isEdit={false} />
      <CourseForm isEdit={true} />
    </div>
  );
}
