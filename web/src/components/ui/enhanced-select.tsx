"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EnhancedSelectItem {
  id: string;
  title: string;
  description: string;
  tags?: string[];
}

interface EnhancedSelectProps {
  data: EnhancedSelectItem[];
  onSelect: (item: EnhancedSelectItem) => void;
  placeholder?: string;
  className?: string;
  selectedItem?: EnhancedSelectItem | null;
}

export function EnhancedSelect({
  data,
  onSelect,
  placeholder = "Select an item...",
  className,
  selectedItem,
}: EnhancedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const handleItemSelect = (item: EnhancedSelectItem) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery("");
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-left"
        data-testid="enhanced-select-trigger"
      >
        <div className="flex-1 min-w-0">
          {selectedItem ? (
            <div>
              <div className="font-medium text-sm">{selectedItem.title}</div>
              <div className="text-xs text-muted-foreground">
                {truncateText(selectedItem.description, 60)}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden">
          <CardContent className="p-0">
            {/* Search Box */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="enhanced-select-search"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredData.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No items found
                </div>
              ) : (
                filteredData.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemSelect(item)}
                    className="w-full p-3 text-left hover:bg-accent hover:text-accent-foreground border-b last:border-b-0 transition-colors"
                    data-testid={`enhanced-select-item-${item.id}`}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {truncateText(item.description)}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={`${item.id}-tag-${index}-${tag}`}
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge
                              key={`${item.id}-tag-more`}
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
