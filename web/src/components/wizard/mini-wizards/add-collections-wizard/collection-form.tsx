import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, PlusCircle } from "lucide-react";
import { collectionSchema, CollectionFormValues } from "./schemas";
import { WizardCollection, phaseTagOptions } from "./types";

interface CollectionFormProps {
  editingCollection: WizardCollection | null;
  onAddCollection: (collection: WizardCollection) => void;
  onCancel: () => void;
}

export function CollectionForm({
  editingCollection,
  onAddCollection,
  onCancel,
}: CollectionFormProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [newPhaseTagInput, setNewPhaseTagInput] = useState("");

  // Form for collections
  const collectionForm = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: editingCollection?.title || "",
      description: editingCollection?.description || "",
      phaseTags: editingCollection?.phaseTags || [],
      tags: editingCollection?.tags || [],
    },
    mode: "onChange",
  });

  const handleSubmit = () => {
    const values = collectionForm.getValues();
    const newCollection: WizardCollection = {
      productId: editingCollection?.productId || "",
      title: values.title,
      description: values.description,
      phaseTags: values.phaseTags,
      tags: values.tags,
      documents: editingCollection?.documents || [],
    };

    onAddCollection(newCollection);
    collectionForm.reset();
  };

  // Tag management functions
  const addTag = (type: "tags" | "phaseTags") => {
    const input = type === "tags" ? newTagInput : newPhaseTagInput;
    const setInput = type === "tags" ? setNewTagInput : setNewPhaseTagInput;

    if (input.trim() === "") return;

    const currentTags = collectionForm.getValues(type);
    if (!currentTags.includes(input.trim())) {
      collectionForm.setValue(type, [...currentTags, input.trim()]);
      setInput("");
    }
  };

  const removeTag = (type: "tags" | "phaseTags", tagToRemove: string) => {
    const currentTags = collectionForm.getValues(type);
    collectionForm.setValue(
      type,
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const isFormValid = collectionForm.formState.isValid;

  return (
    <Form {...collectionForm}>
      <form
        onSubmit={collectionForm.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <h3 className="text-lg font-medium">
          {editingCollection ? "Edit Collection" : "Add New Collection"}
        </h3>

        <FormField
          control={collectionForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter collection title" {...field} />
              </FormControl>
              <FormDescription>
                A clear, descriptive name for your collection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={collectionForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this collection contains"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe the purpose and content of this collection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase Tags */}
        <FormItem>
          <FormLabel>Phase Tags</FormLabel>
          <div className="flex gap-2 mb-2">
            <Select
              onValueChange={(value) => {
                const currentTags = collectionForm.getValues("phaseTags");
                if (!currentTags.includes(value)) {
                  collectionForm.setValue("phaseTags", [...currentTags, value]);
                }
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select phase tags" />
              </SelectTrigger>
              <SelectContent>
                {phaseTagOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-1">
            {collectionForm.watch("phaseTags").map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag("phaseTags", tag)}
                  className="ml-1 text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <FormDescription>
            Select which product phases this collection relates to
          </FormDescription>
        </FormItem>

        {/* General Tags */}
        <FormItem>
          <FormLabel>General Tags</FormLabel>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a tag"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("tags");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addTag("tags")}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {collectionForm.watch("tags").map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag("tags", tag)}
                  className="ml-1 text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <FormDescription>
            Add general tags to categorize this collection
          </FormDescription>
        </FormItem>

        <div className="flex justify-end space-x-2">
          {editingCollection && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!isFormValid}>
            {editingCollection ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Collection
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Collection
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
