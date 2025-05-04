"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Main } from "@/components/layout/main";
import { Copy, Download, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { useAtom } from "jotai";
import {
  deletePromptAtom,
  selectedPromptAtom,
  updatePromptAtom,
} from "@/lib/store/prompt-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Playground from "./playground";
import { PromptForm } from "../components/prompt-form";
import { useState } from "react";
import { Prompt, PromptInput } from "@/lib/firebase/schema";
import { deletePromptAction, updatePromptAction } from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

export default function UserPromptDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompt, setSelectedPrompt] = useAtom(selectedPromptAtom);
  const deletePrompt = useAtom(deletePromptAtom)[1];
  const updatePrompt = useAtom(updatePromptAtom)[1];
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopyToClipboard = () => {
    if (!prompt) return;

    navigator.clipboard.writeText(prompt.body);
    toast({
      title: "Copied",
      duration: TOAST_DEFAULT_DURATION,
      description: "Prompt content copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!prompt) return;

    // Create markdown content
    const markdown = `# ${prompt.title}\n\n${prompt.body}`;

    // Create a blob and download link
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      duration: TOAST_DEFAULT_DURATION,
      description: "Prompt downloaded as markdown",
    });
  };

  const handleEdit = () => {
    if (!prompt) return;
    setIsPromptModalOpen(true);
  };

  const handleDelete = () => {
    if (!prompt) return;
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitPrompt = async (data: PromptInput, _promptId?: string) => {
    if (!prompt || !prompt.id) return;

    setIsSubmitting(true);
    try {
      // Call server action to update prompt
      const result = await updatePromptAction(prompt.id, data);

      if (result.success && result.prompt) {
        // Update both the selected prompt and the prompts list
        updatePrompt(result.prompt); // This updates userPromptsAtom and affects the table/card views
        setSelectedPrompt(result.prompt); // This updates what we're seeing in the detail view

        toast({
          title: "Success",
          description: "Prompt updated successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
        setIsPromptModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update prompt",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
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
  };

  const handleConfirmDelete = async () => {
    if (!prompt || !prompt.id) return;

    setIsSubmitting(true);
    try {
      // Call server action to delete prompt
      const result = await deletePromptAction(prompt.id);

      if (result.success) {
        // Optimistically update UI by removing the prompt
        deletePrompt(prompt.id);

        toast({
          title: "Success",
          description: "Prompt deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });

        // Navigate back to prompts list
        router.push("/myprompts");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompt",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
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
      setIsDeleteDialogOpen(false);
    }
  };

  // Render no prompt selected state
  if (!prompt) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No prompt selected</h2>
          <p className="text-muted-foreground mt-2">
            Please select a prompt from the prompts list
          </p>
          <Button
            onClick={() => router.push("/myprompts")}
            variant="outline"
            className="mt-4"
          >
            Go back
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Prompts", href: "/myprompts" },
            { label: prompt.title, isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{prompt.title}</h1>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-500"
              onClick={handleDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.phaseTags.map((tag) => (
            <Badge key={tag} variant="secondary" className={getPhaseColor(tag)}>
              {tag}
            </Badge>
          ))}
          {prompt.productTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {prompt.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
        </div>

        {/* <div className="prose max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{prompt.body}</p>
        </div> */}

        {/* Start Playground */}
        <Playground prompt={prompt} />
        {/* End Playground */}

        {/* Prompt edit modal */}
        <PromptForm
          prompt={prompt}
          open={isPromptModalOpen}
          onOpenChange={setIsPromptModalOpen}
          onSubmit={handleSubmitPrompt}
        />

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this prompt? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Main>
  );
}
