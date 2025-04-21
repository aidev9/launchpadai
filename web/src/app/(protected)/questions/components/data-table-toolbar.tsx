"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { statusOptions, tagOptions } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { columnFiltersAtom } from "./questions-table";

// Create atoms to track filter state
export const questionFilterAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const tagsFilterAtom = atom<string[]>([]);
export const isFilteringAtom = atom<boolean>(false);

// Computed atom to check if any filters are active
export const hasActiveFiltersAtom = atom((get) => {
  const questionFilter = get(questionFilterAtom);
  const statusFilter = get(statusFilterAtom);
  const tagsFilter = get(tagsFilterAtom);

  return (
    questionFilter !== "" || statusFilter.length > 0 || tagsFilter.length > 0
  );
});

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [questionFilter, setQuestionFilter] = useAtom(questionFilterAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);
  const [hasActiveFilters] = useAtom(hasActiveFiltersAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);

  // Sync table filter state with atoms
  useEffect(() => {
    const questionColumn = table.getColumn("question");
    const statusColumn = table.getColumn("status");
    const tagsColumn = table.getColumn("tags");

    // Update atoms from table state when it changes
    const updateAtomsFromTable = () => {
      const questionValue = questionColumn?.getFilterValue() as string;
      const statusValue = statusColumn?.getFilterValue() as string[];
      const tagsValue = tagsColumn?.getFilterValue() as string[];

      if (questionValue !== undefined && questionValue !== questionFilter) {
        setQuestionFilter(questionValue || "");
      }

      if (
        statusValue !== undefined &&
        JSON.stringify(statusValue) !== JSON.stringify(statusFilter)
      ) {
        setStatusFilter(statusValue || []);
      }

      if (
        tagsValue !== undefined &&
        JSON.stringify(tagsValue) !== JSON.stringify(tagsFilter)
      ) {
        setTagsFilter(tagsValue || []);
      }
    };

    // Initialize from table state
    updateAtomsFromTable();

    // Subscribe to changes in column filters
    const unsubscribe = table.getState().columnFilters.length;

    return () => {
      // No cleanup needed as we're just checking the length
    };
  }, [
    table,
    table.getState().columnFilters.length,
    setQuestionFilter,
    setStatusFilter,
    setTagsFilter,
    questionFilter,
    statusFilter,
    tagsFilter,
  ]);

  // Get column references
  const questionColumn = table.getColumn("question");
  const statusColumn = table.getColumn("status");
  const tagsColumn = table.getColumn("tags");

  // Handle filter reset
  const handleResetFilters = () => {
    // Reset table filters
    table.resetColumnFilters();

    // Reset atom states
    setQuestionFilter("");
    setStatusFilter([]);
    setTagsFilter([]);

    // Reset column filters atom
    setColumnFilters([]);
  };

  // Sync table filters with atoms when atoms change
  const handleQuestionFilterChange = (value: string) => {
    setQuestionFilter(value);
    questionColumn?.setFilterValue(value);
  };

  const handleStatusFilterChange = (value: string[]) => {
    setStatusFilter(value);
    statusColumn?.setFilterValue(value.length > 0 ? value : []);
  };

  const handleTagsFilterChange = (value: string[]) => {
    setTagsFilter(value);
    tagsColumn?.setFilterValue(value.length > 0 ? value : []);
  };

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter questions..."
          value={questionFilter}
          onChange={(event) => handleQuestionFilterChange(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {statusColumn && (
          <DataTableFacetedFilter
            title="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
        )}
        {tagsColumn && (
          <DataTableFacetedFilter
            title="Tags"
            options={tagOptions}
            value={tagsFilter}
            onChange={handleTagsFilterChange}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
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
