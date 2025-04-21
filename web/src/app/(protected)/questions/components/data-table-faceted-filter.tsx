"use client";

import * as React from "react";
import { CheckIcon, PlusCircle } from "lucide-react";
import { atom, useAtom } from "jotai";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export type Option = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

interface DataTableFacetedFilterProps {
  title?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

// Create a Jotai atom factory for filter values
const createFilterValuesAtom = (initialValue: string[]) =>
  atom(new Set(initialValue));

export function DataTableFacetedFilter({
  title,
  options,
  value,
  onChange,
}: DataTableFacetedFilterProps) {
  // Create a unique atom for this instance using a ref to ensure stability
  const filterValuesAtomRef = React.useRef(createFilterValuesAtom(value));

  // Use the atom for state management
  const [selectedValues, setSelectedValues] = useAtom(
    filterValuesAtomRef.current
  );

  // Sync with external value prop when it changes
  React.useEffect(() => {
    if (JSON.stringify(Array.from(selectedValues)) !== JSON.stringify(value)) {
      setSelectedValues(new Set(value));
    }
  }, [value, setSelectedValues]);

  // Handle selection changes
  const handleSelectionChange = (optionValue: string, isSelected: boolean) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);

      if (isSelected) {
        next.delete(optionValue);
      } else {
        next.add(optionValue);
      }

      const newSelectedValues = Array.from(next);

      // If all items are deselected, reset filters by calling onChange with empty array
      if (newSelectedValues.length === 0) {
        onChange([]);
      } else {
        onChange(newSelectedValues);
      }

      return next;
    });
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    // Set local state to empty
    setSelectedValues(new Set());

    // Call onChange with empty array to update external state
    onChange([]);

    // Close the popover after clearing
    const popoverElement = document.activeElement as HTMLElement;
    popoverElement?.blur?.();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() =>
                      handleSelectionChange(option.value, isSelected)
                    }
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClearFilters}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
