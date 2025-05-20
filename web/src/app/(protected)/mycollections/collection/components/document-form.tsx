"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Document,
  DocumentInput,
  documentInputSchema,
} from "@/lib/firebase/schema";
import { createDocumentAction, updateDocumentAction } from "../../actions";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  productId?: string;
  onSuccess?: (document: Document) => void;
  documentToEdit?: Document;
  onDocumentCreated?: (document: Document) => void;
}

export function DocumentForm({
  isOpen,
  onClose,
  collectionId,
  productId,
  onSuccess,
  documentToEdit,
  onDocumentCreated,
}: DocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Initialize form with default values or document values if editing
  const form = useForm({
    resolver: zodResolver(documentInputSchema),
    defaultValues: documentToEdit
      ? {
          collectionId: documentToEdit.collectionId,
          productId: documentToEdit.productId,
          title: documentToEdit.title,
          description: documentToEdit.description,
          tags: documentToEdit.tags,
          url: documentToEdit.url,
          filePath: documentToEdit.filePath,
          chunkSize: documentToEdit.chunkSize || 1000,
          overlap: documentToEdit.overlap || 200,
          status: documentToEdit.status,
        }
      : {
          collectionId,
          productId,
          title: "",
          description: "",
          tags: [],
          url: "",
          filePath: "",
          chunkSize: 1000,
          overlap: 200,
          status: "uploading",
        },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (documentToEdit) {
        // If editing, populate form with document data
        form.reset({
          collectionId: documentToEdit.collectionId,
          productId: documentToEdit.productId,
          title: documentToEdit.title,
          description: documentToEdit.description,
          tags: documentToEdit.tags,
          url: documentToEdit.url,
          filePath: documentToEdit.filePath,
          chunkSize: documentToEdit.chunkSize || 1000,
          overlap: documentToEdit.overlap || 200,
          status: documentToEdit.status,
        });
      } else {
        // If creating new, reset to defaults
        form.reset({
          collectionId,
          productId,
          title: "",
          description: "",
          tags: [],
          url: "",
          filePath: "",
          chunkSize: 1000,
          overlap: 200,
          status: "uploading",
        });
      }
      setSelectedFile(null);
    }
  }, [isOpen, form, collectionId, productId, documentToEdit]);

  // Handle form submission
  async function onSubmit(data: DocumentInput) {
    if (isSubmitting) return; // Prevent double submission

    onClose();
    try {
      setIsSubmitting(true);

      if (documentToEdit) {
        // Update existing document
        const result = await updateDocumentAction(
          documentToEdit.id,
          data,
          selectedFile || undefined
        );

        if (result.success) {
          // Close the modal and show success message
          onClose();

          toast({
            title: "Document updated",
            description: "Document has been updated successfully",
            duration: TOAST_DEFAULT_DURATION,
          });

          // Get the updated document with the new data
          const updatedDocument = {
            ...documentToEdit,
            ...data,
            updatedAt: Date.now() / 1000,
          };

          // Call onSuccess callback with the updated document if provided
          if (onSuccess) {
            onSuccess(updatedDocument);
          }
        } else {
          throw new Error(result.error || "Failed to update document");
        }
      } else {
        // Create new document
        const result = await createDocumentAction(
          data,
          selectedFile || undefined
        );

        if (result.success) {
          // Close the modal and show success message
          onClose();

          toast({
            title: "Document created",
            description: "Document has been created successfully",
            duration: TOAST_DEFAULT_DURATION,
          });

          // Call onSuccess callback with the new document if provided
          if (onSuccess && result.document) {
            onSuccess(result.document);
          }

          // Call onDocumentCreated callback if provided
          if (onDocumentCreated && result.document) {
            onDocumentCreated(result.document);
          }
        } else {
          throw new Error(result.error || "Failed to create document");
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

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="document-form"
        aria-describedby="document-form"
        aria-description="Document form"
      >
        <DialogHeader>
          <DialogTitle>
            {documentToEdit ? "Edit Document" : "Add Document"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document title" {...field} />
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
                      placeholder="Enter document description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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

            {/* Chunk Size and Overlap */}
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="chunkSize"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Chunk Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="100"
                        max="10000"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overlap"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Overlap</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="5000"
                        placeholder="200"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload */}
            <FormItem>
              <FormLabel>Upload Document</FormLabel>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {selectedFile ? (
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {documentToEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{documentToEdit ? "Update Document" : "Add Document"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
