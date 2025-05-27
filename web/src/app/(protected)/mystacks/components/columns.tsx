"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { TechStack } from "@/lib/firebase/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistance } from "date-fns";

export const getStackColumns = (): ColumnDef<TechStack, unknown>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()} // Prevent row click from triggering when clicking checkbox
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium max-w-[250px] truncate">
          {row.getValue("name")}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false, // Usually, name is not hidden
  },
  {
    accessorKey: "appType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="App Type" />
    ),
    cell: ({ row }) => {
      const appType = row.getValue("appType") as string;
      return <div className="max-w-[150px] truncate">{appType || "N/A"}</div>;
    },
    enableSorting: true,
    // filterFn: (row, id, value) => { // Example for faceted filter later
    //   return value.includes(row.getValue(id))
    // },
  },
  {
    accessorKey: "frontEndStack",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Frontend" />
    ),
    cell: ({ row }) => {
      const frontEnd = row.getValue("frontEndStack") as string;
      return <div className="max-w-[150px] truncate">{frontEnd || "N/A"}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "backendStack",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Backend" />
    ),
    cell: ({ row }) => {
      const backend = row.getValue("backendStack") as string;
      return <div className="max-w-[150px] truncate">{backend || "N/A"}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "phase", // In TechStack schema, it's `phase: string[]`
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phases" />
    ),
    cell: ({ row }) => {
      const phases = row.getValue("phase") as string[];
      if (!phases || phases.length === 0) {
        return <div className="text-muted-foreground italic text-xs">None</div>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="secondary"
              // className={cn(getPhaseColor(phase))} // TODO: Implement or choose a color strategy for stack phases
              className="text-xs"
            >
              {phase}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }
      const phases = row.getValue(id) as string[];
      return value.some((val: string) => phases.includes(val));
    },
  },
  {
    accessorKey: "updatedAt", // or "createdAt" depending on what's available in your schema
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const stack = row.original;
      // Use the timestamp directly if available, otherwise fallback to current time
      const timestamp = stack.updatedAt || Date.now();

      // Check if timestamp is in seconds (Firebase often stores in seconds)
      // and convert to milliseconds if needed
      const timeInMs = timestamp > 1e10 ? timestamp : timestamp * 1000;
      const date = new Date(timeInMs);

      return (
        <div className="text-sm text-muted-foreground">
          {formatDistance(date, new Date(), { addSuffix: true })}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // Access handlers from table.options.meta
      const meta = table.options.meta as
        | {
            onViewStack: (stack: TechStack) => void;
            onEditStack: (stack: TechStack) => void;
            onDeleteStack: (stack: TechStack) => void;
          }
        | undefined;

      if (!meta?.onViewStack || !meta?.onEditStack || !meta?.onDeleteStack) {
        // Optionally, handle cases where meta or handlers are not defined,
        // though they should always be passed by StackDataTable.
        // console.error("Action handlers not found in table meta");
        return null; // Or some placeholder/error UI
      }

      return (
        <DataTableRowActions
          row={row.original}
          onView={meta.onViewStack}
          onEdit={meta.onEditStack}
          onDelete={meta.onDeleteStack}
        />
      );
    },
    // meta: {
    //   align: "right",
    // } as ColumnMeta, // If alignment is needed
  },
];
