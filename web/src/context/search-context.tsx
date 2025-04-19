"use client";

import React from "react";
import { CommandMenu } from "@/components/command-menu";

interface SearchContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SearchContext = React.createContext<SearchContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export function SearchProvider({ children }: Props) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandMenu />
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  // Prevent usage on the server
  if (typeof window === "undefined") {
    throw new Error(
      "useSearch() cannot be used on the server. Use it only in client components."
    );
  }
  const searchContext = React.useContext(SearchContext);

  if (!searchContext) {
    throw new Error("useSearch has to be used within <SearchContext.Provider>");
  }

  return searchContext;
};
