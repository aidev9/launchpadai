"use client";

import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { AdminProduct } from "../products-store";
import {
  searchFilterAtom,
  phaseFilterAtom,
  statusFilterAtom,
  countryFilterAtom,
} from "../products-store";
import { useAtom } from "jotai";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

// Product phases
const phases = [
  { label: "Discover", value: "Discover" },
  { label: "Validate", value: "Validate" },
  { label: "Design", value: "Design" },
  { label: "Build", value: "Build" },
  { label: "Secure", value: "Secure" },
  { label: "Launch", value: "Launch" },
  { label: "Grow", value: "Grow" },
];

// Product status options
const statusOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

// Common countries (can be extended)
const countries = [
  { label: "United States", value: "United States" },
  { label: "Canada", value: "Canada" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "Germany", value: "Germany" },
  { label: "Australia", value: "Australia" },
  { label: "France", value: "France" },
  { label: "Netherlands", value: "Netherlands" },
  { label: "Sweden", value: "Sweden" },
  { label: "Norway", value: "Norway" },
  { label: "Denmark", value: "Denmark" },
];

interface ProductsTableToolbarProps {
  table: Table<AdminProduct>;
  onRefresh?: () => Promise<void>;
}

export function ProductsTableToolbar({
  table,
  onRefresh,
}: ProductsTableToolbarProps) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(phaseFilterAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
  const [countryFilter, setCountryFilter] = useAtom(countryFilterAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle global search filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchFilter(value);
    table.setGlobalFilter(value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchFilter("");
    setPhaseFilter([]);
    setStatusFilter([]);
    setCountryFilter([]);

    // Reset column filters
    table.getAllColumns().forEach((column) => {
      if (column.getCanFilter()) {
        column.setFilterValue(undefined);
      }
    });

    // Reset global filter
    table.setGlobalFilter("");
  };

  const isFiltered =
    searchFilter !== "" ||
    phaseFilter.length > 0 ||
    statusFilter.length > 0 ||
    countryFilter.length > 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <DataTableFacetedFilter
            title="Phase"
            options={phases}
            value={phaseFilter}
            onChange={(value) => {
              setPhaseFilter(value);
              table
                .getColumn("phases")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

          <DataTableFacetedFilter
            title="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              table
                .getColumn("isPublic")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

          <DataTableFacetedFilter
            title="Country"
            options={countries}
            value={countryFilter}
            onChange={(value) => {
              setCountryFilter(value);
              table
                .getColumn("country")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              if (onRefresh) {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setIsRefreshing(false);
                }
              }
            }}
            disabled={isRefreshing}
            className="h-8 w-8"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
