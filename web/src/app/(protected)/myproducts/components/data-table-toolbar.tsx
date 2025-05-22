"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import {
  productColumnFiltersAtom,
  productSearchQueryAtom,
  productPhaseFilterAtom,
  productTagsFilterAtom,
} from "@/lib/store/product-store";
import { PHASES } from "./phase-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

// Define phase options
const phaseOptions = PHASES.filter((phase) => phase !== "All").map((phase) => ({
  label: phase,
  value: phase,
}));

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  // Use Jotai atoms
  const [columnFilters, setColumnFilters] = useAtom(productColumnFiltersAtom);
  const [searchQuery, setSearchQuery] = useAtom(productSearchQueryAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(productPhaseFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(productTagsFilterAtom);

  // Check if any filters are applied
  const isFiltered = columnFilters.length > 0;

  // State for available tag options
  const [tagOptions, setTagOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // Get all products from the table data
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

    setTagOptions(
      Array.from(uniqueTags).map((tag) => ({
        label: tag,
        value: tag,
      }))
    );
  }, [table.getFilteredRowModel().flatRows]);

  // Sync search query with name column filter
  useEffect(() => {
    if (searchQuery) {
      table.getColumn("name")?.setFilterValue(searchQuery);
    }
  }, [searchQuery, table]);

  // Handle search query change
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);

    // Update column filters
    if (value) {
      // Find if we already have a name filter
      const existingFilterIndex = columnFilters.findIndex(
        (f) => f.id === "name"
      );
      if (existingFilterIndex >= 0) {
        const newFilters = [...columnFilters];
        newFilters[existingFilterIndex] = { id: "name", value };
        setColumnFilters(newFilters);
      } else {
        setColumnFilters([...columnFilters, { id: "name", value }]);
      }
    } else {
      // Remove name filter if empty
      setColumnFilters(columnFilters.filter((f) => f.id !== "name"));
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSearchQuery("");
    setPhaseFilter([]);
    setTagsFilter([]);
    setColumnFilters([]);
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1 max-w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter products..."
            value={searchQuery}
            onChange={(event) => handleSearchQueryChange(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {table.getColumn("stage") && (
            <DataTableFacetedFilter
              column={table.getColumn("stage")}
              title="Phases"
              options={phaseOptions}
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
      <DataTableViewOptions table={table} />
    </div>
  );
}
