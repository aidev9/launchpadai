"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import {
  searchFilterAtom,
  typeFilterAtom,
  statusFilterAtom,
} from "@/lib/store/feedback-store";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [typeFilter, setTypeFilter] = useAtom(typeFilterAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);

  const isFiltered =
    searchFilter !== "" || typeFilter.length > 0 || statusFilter.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search feedback..."
          value={searchFilter}
          onChange={(event) => setSearchFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={[
              { label: "Bug", value: "bug" },
              { label: "Feature", value: "feature" },
              { label: "Comment", value: "comment" },
            ]}
            selectedValues={typeFilter}
            setSelectedValues={setTypeFilter}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={[
              { label: "New", value: "new" },
              { label: "In Progress", value: "in-progress" },
              { label: "Resolved", value: "resolved" },
            ]}
            selectedValues={statusFilter}
            setSelectedValues={setStatusFilter}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchFilter("");
              setTypeFilter([]);
              setStatusFilter([]);
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
