"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/app/(protected)/myprompts/components/data-table-view-options";
import { DataTableFacetedFilter } from "@/app/(protected)/myprompts/components/data-table-faceted-filter";
import { Search, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  documentColumnFiltersAtom,
  documentSearchQueryAtom,
  documentStatusFilterAtom,
} from "@/lib/store/collection-store";

// Status options
const statusOptions = [
  { label: "Uploading", value: "uploading" },
  { label: "Uploaded", value: "uploaded" },
  { label: "Indexing", value: "indexing" },
  { label: "Indexed", value: "indexed" },
  { label: "Reindexing", value: "reindexing" },
];

interface DocumentTableToolbarProps<TData> {
  table: Table<TData>;
  onDeleteSelected?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  onDeleteSelected,
}: DocumentTableToolbarProps<TData>) {
  // Use Jotai atoms
  const [columnFilters, setColumnFilters] = useAtom(documentColumnFiltersAtom);
  const [titleFilter, setTitleFilter] = useAtom(documentSearchQueryAtom);
  const [statusFilter, setStatusFilter] = useAtom(documentStatusFilterAtom);

  const isFiltered = columnFilters.length > 0;
  const [allTags, setAllTags] = useState<string[]>([]);

  // Extract unique tags from documents
  useEffect(() => {
    const data = table
      .getFilteredRowModel()
      .flatRows.map((row) => row.original);

    // Extract all unique tags
    const uniqueTags = new Set<string>();
    data.forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => uniqueTags.add(tag));
      }
    });

    setAllTags(Array.from(uniqueTags));
  }, [table.getFilteredRowModel().flatRows]);

  // Sync title filter with column filter
  useEffect(() => {
    if (titleFilter) {
      table.getColumn("title")?.setFilterValue(titleFilter);
    }
  }, [titleFilter, table]);

  // Convert tags to options format
  const tagOptions = allTags.map((tag) => ({
    label: tag,
    value: tag,
  }));

  // Handle title filter change
  const handleTitleFilterChange = (value: string) => {
    setTitleFilter(value);

    // Update column filters
    if (value) {
      // Find if we already have a title filter
      const existingFilterIndex = columnFilters.findIndex(
        (f) => f.id === "title"
      );
      if (existingFilterIndex >= 0) {
        const newFilters = [...columnFilters];
        newFilters[existingFilterIndex] = { id: "title", value };
        setColumnFilters(newFilters);
      } else {
        setColumnFilters([...columnFilters, { id: "title", value }]);
      }
    } else {
      // Remove title filter if empty
      setColumnFilters(columnFilters.filter((f) => f.id !== "title"));
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    setTitleFilter("");
    setStatusFilter([]);
    setColumnFilters([]);
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full md:w-60">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={titleFilter}
            onChange={(event) => handleTitleFilterChange(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statusOptions}
            />
          )}
          {table.getColumn("tags") && tagOptions.length > 0 && (
            <DataTableFacetedFilter
              column={table.getColumn("tags")}
              title="Tags"
              options={tagOptions}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetAllFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {Object.keys(table.getState().rowSelection).length > 0 &&
          onDeleteSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              className="h-8 px-2 lg:px-3"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
