"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOption } from "../types/admin-types";
import { X, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterBarProps {
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
}

export function FilterBar({
  filters,
  onFilterChange,
  activeFilters,
}: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(activeFilters);

  const handleFilterChange = (filterId: string, value: string) => {
    const newFilters = {
      ...localFilters,
      [filterId]: value,
    };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = filters.reduce((acc, filter) => {
      acc[filter.id] = "";
      return acc;
    }, {} as Record<string, string>);
    
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (value) => value !== "" && value !== undefined
  );

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary w-4 h-4 text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {Object.values(activeFilters).filter(
                  (value) => value !== "" && value !== undefined
                ).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="font-medium">Filter Options</div>
            <div className="space-y-2">
              {filters.map((filter) => (
                <div key={filter.id} className="grid grid-cols-4 items-center gap-2">
                  <label
                    htmlFor={filter.id}
                    className="text-sm font-medium col-span-1"
                  >
                    {filter.label}
                  </label>
                  <Select
                    value={localFilters[filter.id] || ""}
                    onValueChange={(value) => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger id={filter.id} className="col-span-3">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
              <Button size="sm" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(activeFilters).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="flex items-center bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs"
                >
                  <span>
                    {filters.find((f) => f.id === key)?.label}: 
                    {filters
                      .find((f) => f.id === key)
                      ?.options.find((o) => o.value === value)?.label || value}
                  </span>
                  <button
                    onClick={() => {
                      const newFilters = { ...activeFilters };
                      newFilters[key] = "";
                      onFilterChange(newFilters);
                    }}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
          )}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
