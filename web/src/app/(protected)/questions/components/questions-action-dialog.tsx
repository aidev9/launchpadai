"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { z } from "zod";
import { createQuestion, updateQuestion } from "@/lib/firebase/questions";
import { useAtom, useAtomValue } from "jotai";
import {
  dialogOpenAtom,
  currentQuestionAtom,
} from "../context/questions-context";
import { MultiSelect } from "@/components/ui/multi-select";
import { tagOptions } from "../data/data";
import { useToast } from "@/components/ui/use-toast";

interface QuestionsActionDialogProps {
  mode: "add" | "edit";
}

const formSchema = z.object({
  question: z
    .string()
    .min(3, { message: "Question must be at least 3 characters long" })
    .max(500, { message: "Question must be less than 500 characters" }),
  answer: z.string().optional(),
  project_id: z.string().min(1, { message: "Project is required" }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export function QuestionsActionDialog({ mode }: QuestionsActionDialogProps) {
  const [open, setOpen] = useAtom(dialogOpenAtom);
  const [currentQuestion, setCurrentQuestion] = useAtom(currentQuestionAtom);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isOpen = open === mode;
  const isEdit = mode === "edit";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      project_id: "",
      tags: [],
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (isEdit && currentQuestion) {
      form.reset({
        question: currentQuestion.question,
        answer: currentQuestion.answer || "",
        project_id: currentQuestion.project_id,
        tags: currentQuestion.tags,
      });
    }
  }, [isEdit, currentQuestion, form]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        // For new questions, we need the user_id
        // In a real app, you would get this from the authenticated user
        const user_id = "current_user_id";

        if (isEdit && currentQuestion) {
          // Update existing question
          const response = await updateQuestion(currentQuestion.id, data);

          if (response.success) {
            toast({
              title: "Question updated",
              description: "The question has been successfully updated.",
            });
            setOpen(null);
            setCurrentQuestion(null);
          } else {
            toast({
              title: "Failed to update question",
              description: response.error,
              variant: "destructive",
            });
          }
        } else {
          // Create new question
          const response = await createQuestion({
            ...data,
            user_id,
          });

          if (response.success) {
            toast({
              title: "Question created",
              description: "The question has been successfully created.",
            });
            setOpen(null);
          } else {
            toast({
              title: "Failed to create question",
              description: response.error,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleCancel = () => {
    setOpen(null);
    if (isEdit) {
      setCurrentQuestion(null);
    }
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Question" : "Add New Question"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this question."
              : "Enter the details for a new question."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    The project this question belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your question here"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the answer if available"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={tagOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select tags"
                    />
                  </FormControl>
                  <FormDescription>
                    Select tags that describe the question
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Updating..."
                    : "Creating..."
                  : isEdit
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
