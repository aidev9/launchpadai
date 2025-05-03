import React, { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  API_DELETE_ASSET,
  API_UPLOAD_ASSET,
  MAX_FILE_SIZE,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";

export interface ImageUploadFormControlProps {
  form: any;
  uploadUrl: string;
}

export default function ImageUploadFormControl(
  props: ImageUploadFormControlProps
) {
  const { form } = props;
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const filePath = form.getValues("filePath");
  const { toast } = useToast();

  async function handleRemoveImage() {
    // Only delete from Firebase if there's a filePath
    if (filePath) {
      try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("filePath", filePath || "");
        const response = await fetch(API_DELETE_ASSET, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          console.error("Failed to delete image:", result.error);
        }
      } catch (error) {
        console.error("Failed to delete image:", error);
      } finally {
        setIsLoading(false);
        // Clear form errors
        form.clearErrors("imageUrl");
      }
    }
    // Clear the image preview and uploaded image state
    setImagePreview(null);
    setUploadedImage(null);
    form.setValue("imageUrl", "");
  }

  async function uploadImage(
    file: File
  ): Promise<{ signedUrl: string; filePath: string }> {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadUrl", props.uploadUrl);

      const response = await fetch(API_UPLOAD_ASSET, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload image");
      }

      return {
        signedUrl: result.url,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Handle file upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is too large (e.g., > 10MB)
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    setUploadedImage(file);
    const { signedUrl, filePath } = await uploadImage(file);
    form.setValue("imageUrl", signedUrl[0]);
    form.setValue("filePath", filePath);

    // Clear form errors
    form.clearErrors("imageUrl");

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const isImageUrlValid = (url: string) => {
    const result = /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg)\??.*$/gim.test(
      url
    );
    return result;
  };

  return (
    <>
      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover Image</FormLabel>

            {/* Image Preview */}
            {(imagePreview || (field.value && isImageUrlValid(field.value))) &&
              !isLoading && (
                <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                  <Image
                    src={imagePreview || field.value}
                    alt="Course preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    onError={(e) => console.error(e.target)}
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
            {!imagePreview && !field.value && !isLoading && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
            )}

            {/* Image URL input - only show when no image is selected */}
            {!uploadedImage && !imagePreview && (
              <div className="mt-4">
                <FormControl>
                  <Input
                    placeholder="Or enter image URL..."
                    {...field}
                    value={field.value}
                    onBlur={(e) => {
                      form.setValue("filePath", "");
                    }}
                  />
                </FormControl>
              </div>
            )}

            {/* Show uploading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading the launch codes...</p>
                </div>
              </div>
            )}

            <FormMessage />
          </FormItem>
        )}
      />
      {/* Hidden form field for storing filePath */}
      <FormField
        // control={form.control}
        name="filePath"
        render={({ field }) => <input type="hidden" {...field} />}
      />
    </>
  );
}
