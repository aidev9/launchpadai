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
import { Edit2, Trash } from "lucide-react";
import { useSetAtom } from "jotai";
import { editModuleModalOpenAtom, selectedModuleAtom } from "../modules-store";
import { Module } from "@/lib/firebase/schema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const courseModule = row.original as Module;
  const setEditModuleModalOpen = useSetAtom(editModuleModalOpenAtom);
  const setSelectedModule = useSetAtom(selectedModuleAtom);

  // Handle courseModule edit
  const handleEdit = () => {
    setSelectedModule(courseModule);
    setEditModuleModalOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          className="flex gap-2 items-center cursor-pointer"
          onClick={handleEdit}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex gap-2 items-center cursor-pointer text-destructive focus:text-destructive"
          data-module-id={courseModule.id}
          data-action="delete"
        >
          <Trash className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
