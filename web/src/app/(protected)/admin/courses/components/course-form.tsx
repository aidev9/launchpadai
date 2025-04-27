"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import Image from "next/image";
import { z } from "zod";
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
import { X, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/firebase/courses";
import { createCourse, updateCourse } from "@/lib/firebase/courses";
import {
  addCourseModalOpenAtom,
  editCourseModalOpenAtom,
  selectedCourseAtom,
} from "./courses-store";
import { courseActionAtom } from "./courses-store";

// Schema for course validation
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(200, "Summary must be at most 200 characters"),
  description: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  imageUrl: z.string().url("Please provide a valid URL or upload an image"),
  url: z.string().optional(),
  tags: z.array(z.string()),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  isEdit?: boolean;
}

export function CourseForm({ isEdit = false }: CourseFormProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useAtom(addCourseModalOpenAtom);
  const [editModalOpen, setEditModalOpen] = useAtom(editCourseModalOpenAtom);
  const [selectedCourse, setSelectedCourse] = useAtom(selectedCourseAtom);
  const [, setCourseAction] = useAtom(courseActionAtom);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const { toast } = useToast();

  // Set modal open state based on isEdit prop
  const isOpen = isEdit ? editModalOpen : addModalOpen;
  const setIsOpen = isEdit ? setEditModalOpen : setAddModalOpen;

  // Initialize form with default values or selected course data
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      level: "beginner",
      imageUrl: "",
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
        url: selectedCourse.url || "",
        tags: selectedCourse.tags || [],
      });
    }
  }, [isEdit, selectedCourse, isOpen, form]);

  // Handle form submission
  async function onSubmit(data: CourseFormValues) {
    try {
      setIsSubmitting(true);

      // Use the uploaded image if available, otherwise use the existing/provided URL
      const imageUrl = uploadedImage
        ? await uploadImage(uploadedImage)
        : data.imageUrl;

      if (isEdit && selectedCourse) {
        // Update existing course
        const result = await updateCourse(selectedCourse.id, {
          ...data,
          imageUrl,
        });

        if (result.success) {
          // Update the selected course atom with the updated course data
          const updatedCourse: Course = {
            ...selectedCourse,
            ...data,
            imageUrl,
            updatedAt: new Date().toISOString(),
          };

          // Update the selected course atom to reflect changes
          setSelectedCourse(updatedCourse);

          toast({
            title: "Course updated",
            description: "Course has been updated successfully",
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
          imageUrl,
          url: data.url ?? "",
        });

        if (result.success) {
          const newCourse: Course = {
            id: result.id!,
            ...data,
            imageUrl,
            url: data.url ?? "",
            tags: data.tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          toast({
            title: "Course created",
            description: "Course has been created successfully",
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
      });
    } finally {
      setIsSubmitting(false);
      // Reset form and image states after everything is done
      form.reset();
      setUploadedImage(null);
      setImagePreview(null);
      setImageFileName(null);
    }
  }

  // Handle file upload
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check if the file is too large (e.g., > 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      // We'll set a placeholder URL which will be replaced with the actual URL after upload
      form.setValue("imageUrl", "https://placeholder.com/image.jpg");
    };
    reader.readAsDataURL(file);
  }

  // Handle image removal
  async function handleRemoveImage() {
    // If there's an uploaded image in Firebase Storage and we're editing a course, remove it
    if (imageFileName && isEdit && selectedCourse) {
      try {
        const deleteResponse = await fetch(
          `/api/courses/${selectedCourse.id}/image?fileName=${imageFileName}`,
          { method: "DELETE" }
        );

        const deleteResult = await deleteResponse.json();

        if (!deleteResponse.ok || !deleteResult.success) {
          console.error("Failed to delete image:", deleteResult.error);
        }
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    // Clear the form image state
    setImagePreview(null);
    setUploadedImage(null);
    setImageFileName(null);
    form.setValue("imageUrl", "");
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
    // First reset the form data
    form.reset();
    // Clear uploaded image states
    setUploadedImage(null);
    setImagePreview(null);
    setImageFileName(null);
    // Finally close the modal after a small delay to ensure smooth transition
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  }

  // Helper function to upload image
  async function uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      // For new courses, we'll use a temporary ID that will be replaced
      const tempId = "temp-" + Date.now();
      formData.append("courseId", selectedCourse?.id || tempId);

      const response = await fetch("/api/courses/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload image");
      }

      return result.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
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
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Image</FormLabel>

                  {/* Image Preview */}
                  {(imagePreview || field.value) && !isUploading && (
                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                      <Image
                        src={imagePreview || field.value}
                        alt="Course preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        type="button"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Upload interface */}
                  {!imagePreview && !field.value && (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SVG, PNG, JPG or GIF (MAX. 5MB)
                          </p>
                        </div>
                        <input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  )}

                  {/* Image URL input - only show when no image is selected */}
                  {!uploadedImage && !imagePreview && (
                    <div className="mt-4">
                      <FormControl>
                        <Input
                          placeholder="Or enter image URL"
                          {...field}
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                            if (
                              e.target.value &&
                              e.target.value !== imagePreview
                            ) {
                              // Clear image preview if URL changes
                              setImagePreview(null);
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                  )}

                  {/* Show uploading indicator */}
                  {isUploading && (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Uploading image...</p>
                      </div>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
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
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting || isUploading ? (
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
