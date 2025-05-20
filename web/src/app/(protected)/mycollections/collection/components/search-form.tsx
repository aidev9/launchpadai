"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface SearchFormProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  disabled?: boolean;
}

export function SearchForm({
  onSearch,
  isSearching,
  disabled,
}: SearchFormProps) {
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      return;
    }

    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-query">Search Query</Label>
        <div className="flex space-x-2">
          <Input
            id="search-query"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            data-testid="search-input"
            disabled={disabled}
          />
          <Button
            type="submit"
            disabled={isSearching || disabled}
            data-testid="search-button"
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
