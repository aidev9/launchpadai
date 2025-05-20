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
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Collection,
  CollectionInput,
  collectionInputSchema,
  CollectionStatus,
} from "@/lib/firebase/schema";
import { createCollectionAction, updateCollectionAction } from "../actions";
import {
  collectionModalOpenAtom,
  isEditingCollectionAtom,
  selectedCollectionAtom,
  updateCollectionAtom as updateCollectionAtomBase,
  addCollectionAtom as addCollectionAtomBase,
} from "@/lib/store/collection-store";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { MultiSelect } from "@/components/ui/multi-select";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { useCollections } from "@/hooks/useCollections";
import { selectedProductAtom } from "@/lib/store/product-store";

export function CollectionForm() {
  const [isOpen, setIsOpen] = useAtom(collectionModalOpenAtom);
  const [isEditing, setIsEditing] = useAtom(isEditingCollectionAtom);
  const [selectedCollection, setSelectedCollection] = useAtom(
    selectedCollectionAtom
  );
  const [, updateCollectionAtom] = useAtom(updateCollectionAtomBase);
  const [, addCollectionAtom] = useAtom(addCollectionAtomBase);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();
  const { fetchAllCollections } = useCollections();
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);

  // Initialize form with default values or selected collection data
  const form = useForm({
    resolver: zodResolver(collectionInputSchema),
    defaultValues: {
      title: "",
      description: "",
      phaseTags: [],
      tags: [],
      status: "uploaded" as CollectionStatus,
    },
  });

  // Reset form when selectedCollection changes
  useEffect(() => {
    if (isEditing && selectedCollection && isOpen) {
      form.reset({
        title: selectedCollection.title,
        description: selectedCollection.description,
        phaseTags: selectedCollection.phaseTags,
        tags: selectedCollection.tags,
        status: selectedCollection.status,
      });
    } else if (isOpen) {
      form.reset({
        title: "",
        description: "",
        phaseTags: [],
        tags: [],
        status: "uploaded" as CollectionStatus,
      });
    }
  }, [isEditing, selectedCollection, isOpen, form]);

  // Handle form submission
  async function onSubmit(data: CollectionInput) {
    console.log("Submitted data:", data);
    try {
      setIsSubmitting(true);
      console.log("Submitting form with data:", data);

      // Hide the form first to prevent flickering
      setIsOpen(false);

      if (isEditing && selectedCollection) {
        // Update existing collection
        console.log("Updating collection:", selectedCollection.id);
        const result = await updateCollectionAction(
          selectedCollection.id,
          data
        );
        console.log("Update result:", result);

        if (result.success) {
          // Update the collection in the store directly
          const updatedCollection: Collection = {
            ...selectedCollection,
            ...data,
            updatedAt: getCurrentUnixTimestamp(),
          };
          updateCollectionAtom(updatedCollection);

          toast({
            title: "Collection updated",
            description: "Collection has been updated successfully",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          throw new Error(result.error || "Failed to update collection");
        }
      } else {
        // Create new collection
        console.log("Creating new collection");

        const result = await createCollectionAction({
          ...data,
          productId: selectedProduct?.id || "",
          // Initialize with empty arrays if not provided
          phaseTags: data.phaseTags || [],
          tags: data.tags || [],
        });
        console.log("Create result:", result);

        if (result.success && result.collection) {
          // Add the collection to the store directly
          addCollectionAtom(result.collection);

          // Force a refresh of the collections from the server without showing loading spinner
          fetchAllCollections(true, false);

          // Set the newly created collection as selected
          setSelectedCollection(result.collection);

          toast({
            title: "Collection created",
            description: "Collection has been created successfully",
            duration: TOAST_DEFAULT_DURATION,
          });
        } else {
          throw new Error(result.error || "Failed to create collection");
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);

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

  // Close the dialog and reset form
  function handleClose() {
    setIsOpen(false);
    if (!isEditing) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-8">
        <DialogHeader className="text-center">
          <DialogTitle>
            {isEditing ? "Edit Collection" : "Create New Collection"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Set the productId as a hidden variable */}
            <input
              type="hidden"
              value={selectedProduct?.id || ""}
              {...form.register("productId")}
            />

            {/* Collection Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter collection title" {...field} />
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
                      placeholder="Enter collection description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phase Tags */}
            <FormField
              control={form.control}
              name="phaseTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase Tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={[
                        { value: "Discover", label: "Discover" },
                        { value: "Validate", label: "Validate" },
                        { value: "Design", label: "Design" },
                        { value: "Build", label: "Build" },
                        { value: "Secure", label: "Secure" },
                        { value: "Launch", label: "Launch" },
                        { value: "Grow", label: "Grow" },
                      ]}
                      selected={field.value}
                      onChange={(values) => field.onChange(values)}
                      placeholder="Select phases"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  console.log("Button clicked");
                  console.log("Form validation errors:", form.formState.errors);
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update" : "Create"} Collection</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
