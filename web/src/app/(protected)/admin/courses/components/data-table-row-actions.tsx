"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { Course } from "@/lib/firebase/courses";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  editCourseModalOpenAtom,
  selectedCourseAtom,
  courseFormDataAtom,
  courseActionAtom,
} from "./courses-store";
import { Eye, PenSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteCourse } from "@/lib/firebase/courses";

interface DataTableRowActionsProps {
  row: Row<Course>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const router = useRouter();
  const course = row.original;

  const setSelectedCourse = useSetAtom(selectedCourseAtom);
  const setEditModalOpen = useSetAtom(editCourseModalOpenAtom);
  const setCourseFormData = useSetAtom(courseFormDataAtom);
  const [, setCourseAction] = useAtom(courseActionAtom);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleView = () => {
    // Set the selected course in the atom before navigating
    setSelectedCourse(course);
    router.push(`/admin/courses/course`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedCourse(course);
    setCourseFormData(course);
    setEditModalOpen(true);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    // Make sure the event doesn't bubble up to the row click handler
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    try {
      setIsDeleting(true);
      const result = await deleteCourse(course.id);

      if (result.success) {
        toast({
          title: "Course deleted",
          description: `${course.title} has been deleted successfully.`,
        });

        // Close the dialog
        setDeleteDialogOpen(false);

        // Dispatch a targeted delete action instead of a full refresh
        setCourseAction({
          type: "DELETE",
          courseId: course.id,
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete course: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <PenSquare className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          // When closing the dialog, prevent row click events
          if (!open) {
            // Using setTimeout to ensure this executes after the current event cycle
            setTimeout(() => setDeleteDialogOpen(false), 0);
          } else {
            setDeleteDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{course.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => handleDelete(e)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
