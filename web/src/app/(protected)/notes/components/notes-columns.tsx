"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Note,
  editNoteModalOpenAtom,
  selectedNoteAtom,
  deleteNoteModalOpenAtom,
} from "./notes-store";
import { DataTableColumnHeader } from "./data-table-column-header";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSetAtom } from "jotai";

// This provides access to the atom setters without causing unnecessary rerenders
const ActionsCell = ({ note }: { note: Note }) => {
  const setSelectedNote = useSetAtom(selectedNoteAtom);
  const setEditNoteModalOpen = useSetAtom(editNoteModalOpenAtom);
  const setDeleteNoteModalOpen = useSetAtom(deleteNoteModalOpenAtom);

  const handleEdit = () => {
    setSelectedNote(note);
    setEditNoteModalOpen(true);
  };

  const handleDelete = () => {
    setSelectedNote(note);
    setDeleteNoteModalOpen(true);
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
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Note>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value);
        }}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: cn(
        "sticky md:table-cell left-0 z-10",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
        }}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "note_body",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Note" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate">{row.getValue("note_body")}</div>
    ),
    meta: {
      className: cn(
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      if (!tags || tags.length === 0) return null;

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="px-2 py-0.5 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
    meta: {
      className: "max-w-[200px]",
    },
    filterFn: (row, id, value) => {
      const tags = row.getValue(id) as string[];
      if (!tags || !Array.isArray(tags) || !Array.isArray(value)) return false;
      return value.some((v) => tags.includes(v));
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const date = format(
        new Date((row.getValue("updatedAt") as number) * 1000),
        "MM/dd/yyyy HH:mm"
      );
      return <div className="font-medium">{date}</div>;
    },
    meta: {
      className: "whitespace-nowrap",
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell note={row.original} />,
  },
];
