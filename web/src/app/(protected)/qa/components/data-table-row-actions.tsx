"use client";

import { Row } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Question } from "@/lib/firebase/schema";
import {
  deleteQAModalOpenAtom,
  editQAModalOpenAtom,
  selectedQuestionAtom,
} from "./qa-store";

interface DataTableRowActionsProps {
  row: Row<Question>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const question = row.original;
  const [, setEditModalOpen] = useAtom(editQAModalOpenAtom);
  const [, setDeleteModalOpen] = useAtom(deleteQAModalOpenAtom);
  const [, setSelectedQuestion] = useAtom(selectedQuestionAtom);

  const handleEdit = () => {
    setSelectedQuestion(question);
    setEditModalOpen(true);
  };

  const handleDelete = () => {
    setSelectedQuestion(question);
    setDeleteModalOpen(true);
  };

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            data-testid="row-actions-trigger"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Dialog>
  );
}
