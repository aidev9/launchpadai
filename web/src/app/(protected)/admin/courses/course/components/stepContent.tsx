import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { Upload, X } from "lucide-react";
import React, { useState } from "react";
import ImageUploadFormControl from "@/components/ui/imageUploadFormControl";
import { clientAuth } from "@/lib/firebase/client";
import { Switch } from "@/components/ui/switch";

const userId = clientAuth.currentUser?.uid;
const MODULE_ASSETS_PATH = `storage/${userId}/courses`;

export default function StepContent({
  currentStep,
  form,
}: {
  currentStep: number;
  form: any;
}) {
  // Tag management
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const tag = tagInput.trim();
      if (tag) {
        // Get existing tags or initialize as an empty array
        const currentTags = form.getValues("tags") || [];

        // Add tag only if it does not already exist
        if (!currentTags.includes(tag)) {
          form.setValue("tags", [...currentTags, tag]);
          setTagInput("");
        }
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag: string) => tag !== tagToRemove)
    );
  };

  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter module title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module Content</FormLabel>
                <FormControl>
                  <div data-color-mode="light">
                    <MDEditor
                      value={field.value}
                      onChange={(value) => field.onChange(value || "")}
                      height={200}
                      preview="edit"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    case 2:
      return (
        <ImageUploadFormControl form={form} uploadUrl={MODULE_ASSETS_PATH} />
      );
    case 3:
      return (
        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SVG, PNG, JPG or GIF (MAX. 5MB)
                    </p>
                  </div>
                  {/* <input
                    ref={attachmentsInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleAttachmentsSelected}
                  /> */}
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case 4:
      return (
        <FormField
          control={form.control}
          name="notifyStudents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {/* Use shadcn switch */}
                <Switch
                  id="notifyStudents"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />{" "}
                Notify current students
              </FormLabel>
            </FormItem>
          )}
        />
      );
    case 5:
      return (
        <div className="space-y-6">
          {/* Iterate over all form errors and display in red */}
          {form.formState.errors &&
            Object.keys(form.formState.errors).length > 0 && (
              <div className="text-red-500">
                {Object.values(form.formState.errors).map((error, idx) => {
                  const message =
                    typeof error === "object" &&
                    error !== null &&
                    "message" in error
                      ? (error as { message?: string }).message
                      : undefined;
                  return (
                    <p key={message ?? idx} className="text-sm">
                      {message ?? "Unknown error"}
                    </p>
                  );
                })}
              </div>
            )}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                {/* Display tags as badges */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {(field.value as string[]).map(
                    (tag: string, index: number) => (
                      <Badge key={`${tag}-${index}`} variant="secondary">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    )
                  )}
                </div>
                {/* Input for adding tags */}
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
          <FormField
            control={form.control}
            name="xpAwards"
            render={({ field }) => (
              <FormItem>
                <FormLabel>XP Points</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter XP amount"
                    {...field}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                      field.onChange(Number(onlyNumbers) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    default:
      return null;
  }
}
