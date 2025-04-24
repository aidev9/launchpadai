"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Note } from "./notes-store";
import { DataTableColumnHeader } from "./data-table-column-header";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs">
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
    accessorKey: "last_modified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("last_modified"));
      return (
        <div className="font-medium">{format(date, "MMM d, yyyy, h:mm a")}</div>
      );
    },
    meta: {
      className: "whitespace-nowrap",
    },
  },
];
