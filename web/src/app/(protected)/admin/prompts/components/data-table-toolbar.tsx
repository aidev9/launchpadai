"use client";

import { Table } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { phaseOptions } from "@/utils/constants";
import {
  titleFilterAtom,
  phaseTagsFilterAtom,
  productTagsFilterAtom,
  tagsFilterAtom,
} from "@/lib/store/prompt-store";
import { Prompt } from "@/lib/firebase/schema";

interface DataTableToolbarProps {
  table: Table<Prompt>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const [titleFilter, setTitleFilter] = useAtom(titleFilterAtom);
  const [phaseTagsFilter, setPhaseTagsFilter] = useAtom(phaseTagsFilterAtom);
  const [productTagsFilter, setProductTagsFilter] = useAtom(
    productTagsFilterAtom
  );
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);

  // Get unique product tags from all rows
  const uniqueProductTags = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const productTags = row.getValue("productTags") as string[];
    if (productTags) {
      productTags.forEach((tag) => uniqueProductTags.add(tag));
    }
  });

  const productTagOptions = Array.from(uniqueProductTags)
    .sort()
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  // Get unique tags from all rows
  const uniqueTags = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const tags = row.getValue("tags") as string[];
    if (tags) {
      tags.forEach((tag) => uniqueTags.add(tag));
    }
  });

  const tagOptions = Array.from(uniqueTags)
    .sort()
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  // Convert phase options
  // If phaseOptions is already [{ label, value }], use as is
  const phaseOptionsMapped = phaseOptions;

  const isFiltered =
    phaseTagsFilter.length > 0 ||
    productTagsFilter.length > 0 ||
    tagsFilter.length > 0 ||
    titleFilter.trim() !== "";

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          {phaseOptionsMapped.length > 0 && (
            <DataTableFacetedFilter
              title="Phase"
              options={phaseOptionsMapped}
              value={phaseTagsFilter}
              onChange={setPhaseTagsFilter}
            />
          )}

          {productTagOptions.length > 0 && (
            <DataTableFacetedFilter
              title="Products"
              options={productTagOptions}
              value={productTagsFilter}
              onChange={setProductTagsFilter}
            />
          )}

          {tagOptions.length > 0 && (
            <DataTableFacetedFilter
              title="Tags"
              options={tagOptions}
              value={tagsFilter}
              onChange={setTagsFilter}
            />
          )}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setTitleFilter("");
                setPhaseTagsFilter([]);
                setProductTagsFilter([]);
                setTagsFilter([]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
