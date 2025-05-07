"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const handleUnselect = (option: string) => {
    onChange(selected.filter((s) => s !== option));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          const newSelected = [...selected];
          newSelected.pop();
          onChange(newSelected);
        }
      }

      // Handle arrow down to open dropdown and navigate
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setActiveIndex((prev) => Math.min(prev + 1, selectables.length - 1));
        }
      }

      // Handle arrow up to navigate up
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      // Handle Enter to select the focused option
      if (
        e.key === "Enter" &&
        open &&
        activeIndex >= 0 &&
        activeIndex < selectables.length
      ) {
        e.preventDefault();
        const selectedOption = selectables[activeIndex];
        if (selectedOption) {
          onChange([...selected, selectedOption.value]);
          setInputValue("");
          setOpen(false);
          setActiveIndex(-1);
        }
      }

      // This is not a default behavior of the <input /> field
      if (e.key === "Escape") {
        setOpen(false);
        input.blur();
      }
    }
  };

  // Handle clicking on the container to focus input and open dropdown
  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
      setOpen(true);
    }
  };

  const selectables = options.filter(
    (option) => !selected.includes(option.value)
  );

  // Reset active index when dropdown opens/closes
  React.useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
    }
  }, [open]);

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={`overflow-visible bg-transparent ${className}`}
    >
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`group rounded-md border border-input px-3 py-2 text-sm ring-offset-background cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        }`}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {selected.map((selectedValue) => {
            const option = options.find((o) => o.value === selectedValue);
            return (
              <Badge key={selectedValue} variant="secondary">
                {option?.label || selectedValue}
                {!disabled && (
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(selectedValue);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </Badge>
            );
          })}
          <div className="flex flex-1 items-center">
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onFocus={() => setOpen(true)}
              onBlur={(e) => {
                // Only close if the related target is not in our container
                if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                  setOpen(false);
                }
              }}
              placeholder={selected.length === 0 ? placeholder : ""}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={disabled}
            />
            <ChevronDown
              className="h-4 w-4 text-muted-foreground ml-2"
              onClick={handleContainerClick}
            />
          </div>
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 && !disabled && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full max-h-60 overflow-auto">
              {selectables.map((option, index) => (
                <CommandItem
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onSelect={() => {
                    onChange([...selected, option.value]);
                    setInputValue("");
                    setOpen(false);
                  }}
                  className={`cursor-pointer ${activeIndex === index ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}
