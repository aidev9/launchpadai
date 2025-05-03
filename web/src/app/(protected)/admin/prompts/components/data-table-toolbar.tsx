"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Search } from "lucide-react";
import { phaseOptions } from "@/utils/constants";
import { useState, useEffect } from "react";
import { Prompt } from "@/lib/firebase/schema";

// Product tag options
const productOptions = [
  { label: "SaaS", value: "SaaS" },
  { label: "Mobile App", value: "Mobile App" },
  { label: "Marketplace", value: "Marketplace" },
  { label: "E-commerce", value: "E-commerce" },
  { label: "Web App", value: "Web App" },
];

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [allProductTags, setAllProductTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Extract unique productTags and tags from prompts
  useEffect(() => {
    const data = table
      .getFilteredRowModel()
      .flatRows.map((row) => row.original);

    // Extract all unique product tags
    const uniqueProductTags = new Set<string>();
    data.forEach((item: any) => {
      if (item.productTags && Array.isArray(item.productTags)) {
        item.productTags.forEach((tag: string) => uniqueProductTags.add(tag));
      }
    });

    // Extract all unique tags
    const uniqueTags = new Set<string>();
    data.forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => uniqueTags.add(tag));
      }
    });

    setAllProductTags(Array.from(uniqueProductTags));
    setAllTags(Array.from(uniqueTags));
  }, [table.getFilteredRowModel().flatRows]);

  // Convert product tags to options format
  const dynamicProductOptions = allProductTags.map((tag) => ({
    label: tag,
    value: tag,
  }));

  // Convert tags to options format
  const tagOptions = allTags.map((tag) => ({
    label: tag,
    value: tag,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full md:w-60">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {table.getColumn("phaseTags") && (
            <DataTableFacetedFilter
              column={table.getColumn("phaseTags")}
              title="Phases"
              options={phaseOptions}
            />
          )}
          {table.getColumn("productTags") &&
            dynamicProductOptions.length > 0 && (
              <DataTableFacetedFilter
                column={table.getColumn("productTags")}
                title="Products"
                options={dynamicProductOptions}
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
              onClick={() => table.resetColumnFilters()}
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
