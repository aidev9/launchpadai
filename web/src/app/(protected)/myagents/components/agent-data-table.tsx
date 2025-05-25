"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Agent } from "@/lib/firebase/schema";
import { columns } from "./columns";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtom } from "jotai";
import { agentTableRowSelectionAtom } from "@/lib/store/agent-store";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-facet-filter";
import {
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Rocket,
  Shield,
  Eye,
  TrendingUp,
} from "lucide-react";

interface AgentDataTableProps {
  data: Agent[];
  onViewAgent: (agent: Agent) => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
}

export function AgentDataTable({
  data,
  onViewAgent,
  onEditAgent,
  onDeleteAgent,
}: AgentDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [rowSelection, setRowSelection] = useAtom(agentTableRowSelectionAtom);

  // Define filter options
  const phaseOptions = [
    { label: "Discover", value: "Discover", icon: Eye },
    { label: "Validate", value: "Validate", icon: CheckCircle },
    { label: "Design", value: "Design", icon: Target },
    { label: "Build", value: "Build", icon: Zap },
    { label: "Secure", value: "Secure", icon: Shield },
    { label: "Launch", value: "Launch", icon: Rocket },
    { label: "Grow", value: "Grow", icon: TrendingUp },
  ];

  const statusOptions = [
    { label: "Enabled", value: "enabled", icon: CheckCircle },
    { label: "Disabled", value: "disabled", icon: XCircle },
  ];

  // Listen for delete agent events
  useEffect(() => {
    const handleDeleteAgent = (event: CustomEvent<Agent>) => {
      onDeleteAgent(event.detail);
    };

    document.addEventListener(
      "delete-agent",
      handleDeleteAgent as EventListener
    );

    return () => {
      document.removeEventListener(
        "delete-agent",
        handleDeleteAgent as EventListener
      );
    };
  }, [onDeleteAgent]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const name = row.getValue("name") as string;
      const description = row.getValue("description") as string;
      const systemPrompt = row.getValue("systemPrompt") as string;

      return (
        name?.toLowerCase().includes(searchValue) ||
        description?.toLowerCase().includes(searchValue) ||
        systemPrompt?.toLowerCase().includes(searchValue)
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name, description, or system prompt..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          {table.getColumn("phases") && (
            <DataTableFacetedFilter
              column={table.getColumn("phases")}
              title="Phases"
              options={phaseOptions}
            />
          )}
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statusOptions}
            />
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest('[role="checkbox"]') ||
                      target.closest('[role="switch"]') ||
                      target.closest('[data-testid^="status-"]')
                    ) {
                      return;
                    }
                    onViewAgent(row.original);
                  }}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
