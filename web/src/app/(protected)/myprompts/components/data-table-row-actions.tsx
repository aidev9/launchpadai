"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash } from "lucide-react";
import { Prompt } from "@/lib/firebase/schema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onClick?: (prompt: Prompt) => void;
}

export function DataTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onClick,
}: DataTableRowActionsProps<TData>) {
  const prompt = row.original as Prompt;

  // These handler functions need to completely stop event propagation
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick && prompt) {
      onClick(prompt);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit && prompt) {
      onEdit(prompt);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && prompt) {
      onDelete(prompt);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={handleView}
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          View
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem
            onClick={handleEdit}
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash className="mr-2 h-3.5 w-3.5 text-destructive" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
