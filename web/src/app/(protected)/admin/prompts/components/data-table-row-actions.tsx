"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSetAtom } from "jotai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  promptModalOpenAtom,
  promptActionAtom,
  editedPromptAtom,
} from "@/lib/store/prompt-store";
import Link from "next/link";
import { deletePromptAction } from "@/lib/firebase/actions/prompts";
import { Prompt } from "@/lib/firebase/schema";

interface DataTableRowActionsProps {
  row: Row<Prompt>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const prompt = row.original;
  const setAddPromptModalOpen = useSetAtom(promptModalOpenAtom);
  const setPromptAction = useSetAtom(promptActionAtom);
  const setPromptToEdit = useSetAtom(editedPromptAtom);
  const { toast } = useToast();

  const handleEdit = () => {
    // Set the prompt to edit and open the modal
    setPromptToEdit(prompt);
    setAddPromptModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
      return;
    }

    try {
      // Use the server action for deletion
      const result = await deletePromptAction(prompt.id);
      if (result.success) {
        setPromptAction({
          type: "DELETE",
          promptId: prompt.id,
        });

        toast({
          title: "Prompt deleted",
          description: "The prompt has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompt",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/prompts/${prompt.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
