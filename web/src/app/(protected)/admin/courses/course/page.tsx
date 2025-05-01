"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { useAtom, useSetAtom } from "jotai";
import {
  CalendarIcon,
  Clock,
  Edit2Icon,
  Trash2Icon,
  Users,
} from "lucide-react";
import { deleteCourse } from "@/lib/firebase/courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  selectedCourseAtom,
  editCourseModalOpenAtom,
  courseFormDataAtom,
} from "../components/courses-store";
import { CourseForm } from "../components/course-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ModuleList } from "./components/module-list";
import { addModuleModalOpenAtom } from "./components/modules-store";
import { ModuleForm } from "./components/module-form";
import { editModuleModalOpenAtom } from "./components/modules-store";
import { PLACEHOLDER_IMAGE_URL } from "@/utils/constants";

// Level badge colors
const levelColors = new Map([
  ["beginner", "bg-green-600 text-white hover:bg-green-700"],
  ["intermediate", "bg-blue-600 text-white hover:bg-blue-700"],
  ["advanced", "bg-purple-600 text-white hover:bg-purple-700"],
]);

export default function CourseDetailPage() {
  const [course, setCourse] = useAtom(selectedCourseAtom);
  const [isDeleting, setIsDeleting] = useState(false);
  const setEditModalOpen = useSetAtom(editCourseModalOpenAtom);
  const setCourseFormData = useSetAtom(courseFormDataAtom);
  const [addModuleModalOpen, setAddModuleModalOpen] = useAtom(
    addModuleModalOpenAtom
  );

  const router = useRouter();
  const { toast } = useToast();

  // If no course is selected, redirect to the courses page
  useEffect(() => {
    if (!course) {
      router.push("/admin/courses");
    }
  }, [course, router]);

  const handleEdit = () => {
    // Set the form data and open the edit modal
    if (course) {
      setCourseFormData(course);
      setEditModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!course) return;

    try {
      setIsDeleting(true);
      const result = await deleteCourse(course.id);

      if (result.success) {
        toast({
          title: "Course deleted",
          description: "Course has been deleted successfully",
        });
        router.push("/admin/courses");
      } else {
        throw new Error(result.error || "Failed to delete course");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // If no course is found (this shouldn't happen due to the router push in useEffect)
  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <p className="text-muted-foreground mb-4">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/admin/courses")}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Header with course title and actions
  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Courses", href: "/admin/courses" },
          { label: course.title, href: "", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{course.title}</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit2Icon className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2Icon className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  course "{course.title}" and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Course details layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Image and metadata */}
        <Card className="md:col-span-1">
          <CardContent className="p-0">
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={course.imageUrl || PLACEHOLDER_IMAGE_URL}
                alt={course.title}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <Badge
                  className={`capitalize ${levelColors.get(course.level)}`}
                >
                  {course.level}
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Students data not available</span>
                </div>

                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Created:{" "}
                    {course.createdAt
                      ? format(new Date(course.createdAt), "MMM d, yyyy")
                      : "Unknown"}
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Updated:{" "}
                    {course.updatedAt
                      ? format(new Date(course.updatedAt), "MMM d, yyyy")
                      : "Unknown"}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags && course.tags.length > 0 ? (
                    course.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Course content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Course Summary</h2>
                <p className="text-muted-foreground">{course.summary}</p>
              </div>

              {course.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {course.description}
                  </div>
                </div>
              )}

              {course.url && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Course URL</h2>
                  <div className="flex items-center">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {course.url}
                    </code>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Detailed course information will be available soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Course analytics will be available soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="mt-4">
              {/* Module list component */}
              <ModuleList courseId={course.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Render the CourseForm component for editing */}
      <CourseForm isEdit={true} />

      {/* Render the ModuleForm component for adding */}
      {addModuleModalOpen && <ModuleForm isEdit={false} courseId={course.id} />}

      {/* Render the ModuleForm component for editing */}
      <ModuleForm isEdit={true} courseId={course.id} />
    </div>
  );
}
