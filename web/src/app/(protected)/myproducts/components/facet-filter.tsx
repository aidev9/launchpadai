"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FacetFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function FacetFilter({
  title,
  options,
  selectedValues,
  onChange,
}: FacetFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelectionChange = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const clearSelection = () => {
    onChange([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-1 h-9 bg-background border-input",
            selectedValues.length > 0 && "border-primary text-primary"
          )}
          data-testid={`facet-filter-${title.toLowerCase()}`}
        >
          {selectedValues.length > 0 ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {title}
              <Badge
                variant="secondary"
                className="ml-1 px-1 rounded-sm font-normal"
              >
                {selectedValues.length}
              </Badge>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              {title}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        align="start"
        data-testid={`facet-filter-content-${title.toLowerCase()}`}
      >
        <div className="p-2 font-medium border-b">
          <div className="flex items-center justify-between">
            <span>Filter by {title}</span>
            {selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={clearSelection}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px] overflow-auto">
          <div className="p-2">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 py-1.5"
              >
                <Checkbox
                  id={`${title}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => handleSelectionChange(option.value)}
                />
                <label
                  htmlFor={`${title}-${option.value}`}
                  className="text-sm font-normal cursor-pointer flex items-center"
                >
                  {option.color && (
                    <span
                      className={`mr-1.5 inline-block w-2 h-2 rounded-full ${option.color}`}
                    />
                  )}
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
