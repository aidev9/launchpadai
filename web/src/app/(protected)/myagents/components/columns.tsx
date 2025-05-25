"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Agent } from "@/lib/firebase/schema";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { StatusToggle } from "./status-toggle";
import { Bot, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const columns: ColumnDef<Agent>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="translate-y-[2px]"
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
        <div className="flex items-center">
          <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      return (
        <div className="line-clamp-2 max-w-[300px]">
          {row.getValue("description") || "No description"}
        </div>
      );
    },
  },
  {
    accessorKey: "systemPrompt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="System Prompt" />
    ),
    cell: ({ row }) => {
      const systemPrompt = row.getValue("systemPrompt") as string;
      return (
        <div className="max-w-[250px] truncate text-sm text-muted-foreground">
          {systemPrompt || "No system prompt"}
        </div>
      );
    },
  },
  {
    accessorKey: "phases",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phases" />
    ),
    cell: ({ row }) => {
      const phases = row.getValue("phases") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {phases && phases.length > 0 ? (
            phases.slice(0, 3).map((phase) => (
              <Badge
                key={phase}
                variant="outline"
                className="bg-primary/10 text-primary text-xs"
              >
                {phase}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No phases</span>
          )}
          {phases && phases.length > 3 && (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              +{phases.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const phases = row.getValue(id) as string[];
      return value.some((val: string) => phases.includes(val));
    },
  },
  {
    accessorKey: "collections",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Collections" />
    ),
    cell: ({ row }) => {
      const collections = row.getValue("collections") as string[];
      return (
        <div className="text-center">
          {collections ? collections.length : 0}
        </div>
      );
    },
  },
  {
    accessorKey: "tools",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tools" />
    ),
    cell: ({ row }) => {
      const tools = row.getValue("tools") as string[];
      return <div className="text-center">{tools ? tools.length : 0}</div>;
    },
  },
  {
    id: "status",
    accessorFn: (row) =>
      row.configuration?.isEnabled ? "enabled" : "disabled",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const agent = row.original;
      const isEnabled = agent.configuration?.isEnabled || false;
      return (
        <div className="flex items-center justify-center">
          <StatusToggle
            agentId={agent.id}
            isEnabled={isEnabled}
            variant="switch"
            size="sm"
          />
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const agent = row.original;
      const isEnabled = agent.configuration?.isEnabled || false;
      return value.includes(isEnabled ? "enabled" : "disabled");
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as any;
      if (!updatedAt) return <span className="text-muted-foreground">-</span>;

      // Handle unix timestamp (seconds) - convert to milliseconds for Date constructor
      const date =
        typeof updatedAt === "number"
          ? new Date(updatedAt * 1000)
          : updatedAt.toDate
            ? updatedAt.toDate()
            : new Date(updatedAt);

      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const agent = row.original;
      return <DataTableRowActions row={row} data={agent} />;
    },
  },
];
