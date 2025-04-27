"use client";

import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course, getAllCourses, deleteCourse } from "@/lib/firebase/courses";
import { columns } from "./components/courses-columns";
import { CoursesTable } from "./components/courses-table";
import { CourseForm } from "./components/course-form";
import { EmptyState } from "./components/empty-state";
import {
  addCourseModalOpenAtom,
  rowSelectionAtom,
  courseActionAtom,
  initialLoadAtom,
  CourseAction,
} from "./components/courses-store";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SeedCoursesButton } from "./components/seed-courses-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const setAddCourseModalOpen = useSetAtom(addCourseModalOpenAtom);
  const [courseAction, setCourseAction] = useAtom(courseActionAtom);
  const [initialLoad] = useAtom(initialLoadAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const { toast } = useToast();

  // Get selected course IDs
  const selectedRowIndexes = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  );
  const hasSelectedCourses = selectedRowIndexes.length > 0;

  // Initial fetch of courses
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
  }, [toast, initialLoad]); // Only fetch on initial load

  // Handle targeted updates to courses
  useEffect(() => {
    if (!courseAction) return;

    switch (courseAction.type) {
      case "ADD":
        setCourses((prevCourses) => [...prevCourses, courseAction.course]);
        break;

      case "UPDATE":
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.id === courseAction.course.id ? courseAction.course : course
          )
        );
        break;

      case "DELETE":
        setCourses((prevCourses) =>
          prevCourses.filter((course) => course.id !== courseAction.courseId)
        );
        break;

      case "DELETE_MANY":
        setCourses((prevCourses) =>
          prevCourses.filter(
            (course) => !courseAction.courseIds.includes(course.id)
          )
        );
        break;

      case "LOAD":
        setCourses(courseAction.courses);
        break;
    }

    // Reset the action after processing
    setCourseAction(null);
  }, [courseAction, setCourseAction]);

  // Handle deleting selected courses
  const handleDeleteSelected = async () => {
    setIsDeleting(true);

    try {
      let failedCount = 0;
      let successCount = 0;

      // Map row indexes to actual course IDs
      const selectedCourseIds = selectedRowIndexes
        .map((index) => {
          const numericIndex = parseInt(index, 10);
          return courses[numericIndex]?.id;
        })
        .filter(Boolean) as string[]; // Filter out any undefined values

      const successfullyDeletedIds: string[] = [];

      // Delete courses one by one
      for (const id of selectedCourseIds) {
        try {
          const result = await deleteCourse(id);
          if (result.success) {
            successCount++;
            successfullyDeletedIds.push(id);
          } else {
            failedCount++;
            console.error(`Failed to delete course ${id}: ${result.error}`);
          }
        } catch (err) {
          failedCount++;
          console.error(`Error deleting course ${id}:`, err);
        }
      }

      // Update the UI based on the results
      if (successCount > 0) {
        // Update courses state to remove deleted courses
        setCourseAction({
          type: "DELETE_MANY",
          courseIds: successfullyDeletedIds,
        });

        // Clear row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Courses deleted",
          description: `Successfully deleted ${successCount} ${successCount === 1 ? "course" : "courses"}${
            failedCount > 0
              ? `. Failed to delete ${failedCount} ${failedCount === 1 ? "course" : "courses"}.`
              : ""
          }`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete selected courses.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting courses",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Courses", href: "", isCurrentPage: true },
        ]}
      />

      <div className="mt-8 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">
            Manage your courses and track their performance
          </p>
        </div>
        {courses.length > 0 && (
          <div className="flex items-center gap-2">
            <SeedCoursesButton />
            {hasSelectedCourses && (
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            )}
            <Button onClick={() => setAddCourseModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Courses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRowIndexes.length}{" "}
              selected {selectedRowIndexes.length === 1 ? "course" : "courses"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSelected();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course form modals */}
      <CourseForm isEdit={false} />
      <CourseForm isEdit={true} />
    </div>
  );
}
