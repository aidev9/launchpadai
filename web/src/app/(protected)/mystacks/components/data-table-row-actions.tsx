"use client";

import { useState } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { TechStack } from "@/lib/firebase/schema";

interface DataTableRowActionsProps {
  row: TechStack; // Use TechStack directly as we pass row.original
  onView: (stack: TechStack) => void;
  onEdit: (stack: TechStack) => void;
  onDelete: (stack: TechStack) => void;
}

export function DataTableRowActions({
  row,
  onView,
  onEdit,
  onDelete,
}: DataTableRowActionsProps) {
  const [open, setOpen] = useState(false);

  // Event handlers to prevent row click when interacting with menu
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAction = (
    e: React.MouseEvent,
    callback: (stack: TechStack) => void,
    shouldClose = false
  ) => {
    e.stopPropagation();
    e.preventDefault();
    callback(row);
    if (shouldClose) {
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          onClick={stopPropagation} // Prevent row click when opening menu
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
        onClick={stopPropagation} // Prevent row click when interacting with menu items container
      >
        <DropdownMenuItem
          onClick={(e) => handleAction(e, onView)}
          className="cursor-pointer"
        >
          <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => handleAction(e, onEdit)}
          className="cursor-pointer"
        >
          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => handleAction(e, onDelete, true)}
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50 cursor-pointer"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
