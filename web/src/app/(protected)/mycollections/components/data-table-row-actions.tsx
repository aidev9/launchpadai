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
import { Pencil, Trash, ExternalLink } from "lucide-react";
import { Collection } from "@/lib/firebase/schema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onClick?: (collection: Collection) => void;
}

export function DataTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
  onClick,
}: DataTableRowActionsProps<TData>) {
  const collection = row.original as Collection;

  // These handler functions need to completely stop event propagation
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick && collection) {
      onClick(collection);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit && collection) {
      onEdit(collection);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && collection) {
      onDelete(collection);
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
        {onClick && (
          <DropdownMenuItem
            onClick={handleView}
            onSelect={(e) => e.preventDefault()}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem
            onClick={handleEdit}
            onSelect={(e) => e.preventDefault()}
          >
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            {(onEdit || onClick) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={handleDelete}
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
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
