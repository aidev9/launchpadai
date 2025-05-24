import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Save, PlusCircle, Upload } from "lucide-react";
import { documentSchema, DocumentFormValues } from "./schemas";
import { WizardDocument } from "./types";
import { useToast } from "@/hooks/use-toast";

interface DocumentFormProps {
  editingDocument: WizardDocument | null;
  onAddDocument: (document: WizardDocument) => void;
  onCancel: () => void;
}

export function DocumentForm({
  editingDocument,
  onAddDocument,
  onCancel,
}: DocumentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Form for documents
  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: editingDocument?.title || "",
      description: editingDocument?.description || "",
      tags: editingDocument?.tags || [],
      chunkSize: editingDocument?.chunkSize || 1000,
      overlap: editingDocument?.overlap || 200,
    },
    mode: "onChange",
  });

  const handleSubmit = () => {
    const values = documentForm.getValues();
    const newDocument: WizardDocument = {
      collectionId: editingDocument?.collectionId || "",
      productId: editingDocument?.productId || "",
      title: values.title,
      description: values.description,
      tags: values.tags,
      chunkSize: values.chunkSize,
      overlap: values.overlap,
      file: selectedFile || editingDocument?.file,
      status: selectedFile ? "uploading" : "uploaded",
      uploadProgress: selectedFile ? 0 : undefined,
    };

    onAddDocument(newDocument);

    // Show message about upload
    if (selectedFile) {
      toast({
        title: "Document added",
        description: "Document will be uploaded when you complete this step.",
      });
    }

    // Reset form and state
    documentForm.reset();
    setSelectedFile(null);
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Card className="p-4">
      <Form {...documentForm}>
        <form
          onSubmit={documentForm.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <h4 className="font-medium">
            {editingDocument ? "Edit Document" : "Add New Document"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={documentForm.control}
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

            <FormField
              control={documentForm.control}
              name="chunkSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chunk Size</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="100"
                      max="10000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={documentForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe this document"
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Upload */}
          <FormItem>
            <FormLabel>Upload Document (Optional)</FormLabel>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
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
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </FormItem>

          <div className="flex justify-end space-x-2">
            {editingDocument && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {editingDocument ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Document
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Document
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
