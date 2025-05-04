"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { DataTableColumnHeader } from "./column-header";
import { DataTableRowActions } from "./row-actions";
import { cn } from "@/lib/utils";

interface PromptsColumnsProps {
  onUseAsTemplate?: (prompt: Prompt) => void;
}

// Define the column meta type to include custom properties
interface ColumnMeta {
  className?: string;
  align?: "left" | "center" | "right";
}

export const getColumns = ({
  onUseAsTemplate,
}: PromptsColumnsProps): ColumnDef<Prompt, any>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium max-w-[300px] truncate">
          {row.getValue("title")}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "phaseTags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phases" />
    ),
    cell: ({ row }) => {
      const phases = row.getValue("phaseTags") as string[];

      if (!phases || phases.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="secondary"
              className={cn(getPhaseColor(phase))}
            >
              {phase}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const phases = row.getValue(id) as string[];
      return value.some((val: string) => phases.includes(val));
    },
  },
  {
    accessorKey: "productTags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Products" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("productTags") as string[];

      if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline">+{tags.length - 2}</Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];

      if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="bg-muted">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as number;
      if (!updatedAt) return <div>Invalid Date</div>;

      const date = new Date(updatedAt);
      return <div>{date.toLocaleDateString()}</div>;
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions row={row} onUseAsTemplate={onUseAsTemplate} />
    ),
    meta: {
      align: "right",
    } as ColumnMeta,
  },
];
