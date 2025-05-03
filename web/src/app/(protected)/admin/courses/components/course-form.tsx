"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Course, CourseInput, courseInputSchema } from "@/lib/firebase/schema";
import { createCourse, updateCourse } from "@/lib/firebase/courses";
import {
  addCourseModalOpenAtom,
  editCourseModalOpenAtom,
  selectedCourseAtom,
  courseActionAtom,
} from "@/lib/store/course-store";
import ImageUploadFormControl from "@/components/ui/imageUploadFormControl";
import { clientAuth } from "@/lib/firebase/client";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

const userId = clientAuth.currentUser?.uid;
const COURSE_ASSETS_PATH = `storage/${userId}/courses`;

interface CourseFormProps {
  isEdit?: boolean;
}

export function CourseForm({ isEdit = false }: CourseFormProps) {
  const [addModalOpen, setAddModalOpen] = useAtom(addCourseModalOpenAtom);
  const [editModalOpen, setEditModalOpen] = useAtom(editCourseModalOpenAtom);
  const [selectedCourse, setSelectedCourse] = useAtom(selectedCourseAtom);
  const [, setCourseAction] = useAtom(courseActionAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  // Set modal open state based on isEdit prop
  const isOpen = isEdit ? editModalOpen : addModalOpen;
  const setIsOpen = isEdit ? setEditModalOpen : setAddModalOpen;

  // Initialize form with default values or selected course data
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseInputSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      level: "beginner",
      imageUrl: "",
      filePath: "",
      url: "",
      tags: [],
    },
  });

  // Reset form when selectedCourse changes
  useEffect(() => {
    if (isEdit && selectedCourse && isOpen) {
      form.reset({
        title: selectedCourse.title,
        summary: selectedCourse.summary,
        description: selectedCourse.description || "",
        level: selectedCourse.level,
        imageUrl: selectedCourse.imageUrl,
        filePath: selectedCourse.filePath || "",
        url: selectedCourse.url || "",
        tags: selectedCourse.tags || [],
      });
    }
  }, [isEdit, selectedCourse, isOpen, form]);

  // Handle form submission
  async function onSubmit(data: CourseInput) {
    try {
      setIsSubmitting(true);

      // When editing, we need to check if the selected course exists
      if (isEdit && selectedCourse) {
        // Update existing course
        const result = await updateCourse(selectedCourse.id, {
          ...data,
        });

        if (result.success) {
          // Update the selected course atom with the updated course data
          const updatedCourse: Course = {
            ...selectedCourse,
            ...data,
            updatedAt: new Date().toISOString(),
          };

          // Update the selected course atom to reflect changes
          setSelectedCourse(updatedCourse);

          toast({
            title: "Course updated",
            description: "Course has been updated successfully",
            duration: TOAST_DEFAULT_DURATION,
          });

          // Close the modal first
          setIsOpen(false);

          // Dispatch a targeted update action instead of a full refresh
          setCourseAction({
            type: "UPDATE",
            course: updatedCourse,
          });
        } else {
          throw new Error(result.error || "Failed to update course");
        }
      } else {
        // Create new course
        const result = await createCourse({
          ...data,
          url: data.url ?? "",
        });

        if (result.success) {
          const newCourse: Course = {
            id: result.id!,
            ...data,
            url: data.url ?? "",
            tags: data.tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          toast({
            title: "Course created",
            description: "Course has been created successfully",
            duration: TOAST_DEFAULT_DURATION,
          });

          // Close the modal first
          setIsOpen(false);

          // Dispatch a targeted add action instead of a full refresh
          setCourseAction({
            type: "ADD",
            course: newCourse,
          });
        } else {
          throw new Error(result.error || "Failed to create course");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  }

  // Handle tag input
  function handleAddTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const tag = tagInput.trim();
      if (tag && !form.getValues("tags").includes(tag)) {
        form.setValue("tags", [...form.getValues("tags"), tag]);
        setTagInput("");
      }
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove)
    );
  }

  // Close the dialog and reset form
  function handleClose() {
    setIsOpen(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Add New Course"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of the course"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the course"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Level */}
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course URL Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/academy/courses/[path]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Image */}
            <ImageUploadFormControl
              form={form}
              uploadUrl={COURSE_ASSETS_PATH}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>

                  {/* Display tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.getValues("tags").map((tag, index) => (
                      <Badge key={`${tag}-${index}`} variant="secondary">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>

                  {/* Tags input */}
                  <FormControl>
                    <Input
                      placeholder="Add tags (press Enter or comma to add)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEdit ? "Update" : "Create"} Course</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
