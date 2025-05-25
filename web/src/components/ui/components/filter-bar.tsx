"use client";

import { useAtom, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  X,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import {
  layoutViewAtom,
  promptPhaseFilterAtom,
  promptSearchQueryAtom,
} from "@/lib/store/prompt-store";
import {
  productPhaseFilterAtom,
  productSearchQueryAtom,
  productViewModeAtom,
} from "@/lib/store/product-store";
import {
  techStackPhaseFilterAtom,
  techStackSearchQueryAtom,
  techStackLayoutViewAtom,
} from "@/lib/store/techstack-store";
import {
  agentLayoutViewAtom,
  agentPhaseFilterAtom,
  agentSearchQueryAtom,
} from "@/lib/store/agent-store";
import {
  viewModeAtom as notesViewModeAtom,
  phaseFilterAtom as notesPhaseFilterAtom,
  searchQueryAtom as notesSearchQueryAtom,
} from "@/app/(protected)/notes/components/notes-store";
import {
  questionsPhaseFilterAtom,
  searchQueryAtom as questionsSearchQueryAtom,
  viewModeAtom as questionsViewModeAtom,
} from "@/app/(protected)/qa/components/qa-store";
import {
  collectionViewModeAtom,
  collectionPhaseFilterAtom,
  collectionSearchQueryAtom,
} from "@/lib/store/collection-store";
import { PrimitiveAtom } from "jotai";
import { Phases } from "@/lib/firebase/schema";

type FilterMode =
  | "notes"
  | "prompts"
  | "products"
  | "questions"
  | "techstack"
  | "collections"
  | "agents";

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: FilterMode;
  placeholderText?: string;
}

// Get all phase values from the enum, excluding 'ALL' since we'll add it separately
const DEFAULT_PHASES = [
  "All",
  ...Object.values(Phases).filter((phase) => phase !== Phases.ALL),
];

export function FilterBar({ mode, placeholderText, ...props }: FilterBarProps) {
  // Use separate atoms for each mode to avoid type issues
  const [promptPhases, setPromptPhases] = useAtom(promptPhaseFilterAtom);
  const [productPhases, setProductPhases] = useAtom(productPhaseFilterAtom);
  const [techStackPhases, setTechStackPhases] = useAtom(
    techStackPhaseFilterAtom
  );
  const [notesPhases, setNotesPhases] = useAtom(notesPhaseFilterAtom);
  const [questionsPhases, setQuestionsPhases] = useAtom(
    questionsPhaseFilterAtom
  );
  const [collectionPhases, setCollectionPhases] = useAtom(
    collectionPhaseFilterAtom
  );
  const [agentPhases, setAgentPhases] = useAtom(agentPhaseFilterAtom);

  // Use the appropriate search query atom based on mode
  let searchQueryAtom;
  switch (mode) {
    case "notes":
      searchQueryAtom = notesSearchQueryAtom;
      break;
    case "prompts":
      searchQueryAtom = promptSearchQueryAtom;
      break;
    case "products":
      searchQueryAtom = productSearchQueryAtom;
      break;
    case "questions":
      searchQueryAtom = questionsSearchQueryAtom;
      break;
    case "collections":
      searchQueryAtom = collectionSearchQueryAtom;
      break;
    case "agents":
      searchQueryAtom = agentSearchQueryAtom;
      break;
    default:
      searchQueryAtom = techStackSearchQueryAtom;
  }

  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);

  // Get the appropriate phase filter atom based on mode
  let phaseFilterAtom;
  switch (mode) {
    case "notes":
      phaseFilterAtom = notesPhaseFilterAtom;
      break;
    case "prompts":
      phaseFilterAtom = promptPhaseFilterAtom;
      break;
    case "products":
      phaseFilterAtom = productPhaseFilterAtom;
      break;
    case "questions":
      phaseFilterAtom = questionsPhaseFilterAtom;
      break;
    case "collections":
      phaseFilterAtom = collectionPhaseFilterAtom;
      break;
    case "agents":
      phaseFilterAtom = agentPhaseFilterAtom;
      break;
    default:
      phaseFilterAtom = techStackPhaseFilterAtom;
  }

  const [phaseFilter, setPhaseFilter] = useAtom(phaseFilterAtom);

  // Handle view mode for prompts, products, tech stacks, notes, collections, and agents
  const [promptViewMode, setPromptViewMode] = useAtom(layoutViewAtom);
  const [productViewMode, setProductViewMode] = useAtom(productViewModeAtom);
  const [techStackViewMode, setTechStackViewMode] = useAtom(
    techStackLayoutViewAtom
  );
  const [notesViewMode, setNotesViewMode] = useAtom(notesViewModeAtom);
  const [collectionViewMode, setCollectionViewMode] = useAtom(
    collectionViewModeAtom
  );
  const [questionsViewMode, setQuestionsViewMode] = useAtom(
    questionsViewModeAtom
  );
  const [agentViewMode, setAgentViewMode] = useAtom(agentLayoutViewAtom);

  // Handle phase filter for prompts, products, tech stacks, notes, collections, and agents
  const showPhaseFilter =
    mode === "prompts" ||
    mode === "products" ||
    mode === "techstack" ||
    mode === "notes" ||
    mode === "questions" ||
    mode === "collections" ||
    mode === "agents";

  const handleTagClick = (phase: string) => {
    if (phase === "All") {
      // If "All" is clicked, clear all filters
      if (mode === "prompts") setPromptPhases([]);
      else if (mode === "products") setProductPhases([]);
      else if (mode === "notes") setNotesPhases([]);
      else if (mode === "questions") setQuestionsPhases([]);
      else if (mode === "collections") setCollectionPhases([]);
      else if (mode === "agents") setAgentPhases([]);
      else setTechStackPhases([]);
      return;
    }

    let newSelectedPhases: string[];

    if (phaseFilter.includes(phase)) {
      // If the phase is already selected, remove it
      newSelectedPhases = phaseFilter.filter((p) => p !== phase);
    } else {
      // Otherwise, add it to the selection
      newSelectedPhases = [...phaseFilter, phase];
    }

    // Update the appropriate atom based on mode
    if (mode === "prompts") setPromptPhases(newSelectedPhases);
    else if (mode === "products") setProductPhases(newSelectedPhases);
    else if (mode === "notes") setNotesPhases(newSelectedPhases);
    else if (mode === "questions") setQuestionsPhases(newSelectedPhases as any);
    else if (mode === "collections") setCollectionPhases(newSelectedPhases);
    else if (mode === "agents") setAgentPhases(newSelectedPhases);
    else setTechStackPhases(newSelectedPhases as any);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleGridView = () => {
    if (mode === "prompts") {
      setPromptViewMode("card");
    } else if (mode === "products") {
      setProductViewMode("grid");
    } else if (mode === "notes") {
      setNotesViewMode("grid");
    } else if (mode === "questions") {
      setQuestionsViewMode("grid");
    } else if (mode === "collections") {
      setCollectionViewMode("grid");
    } else if (mode === "agents") {
      setAgentViewMode("card");
    } else {
      setTechStackViewMode("card");
    }
  };

  const toggleTableView = () => {
    if (mode === "prompts") {
      setPromptViewMode("table");
    } else if (mode === "products") {
      setProductViewMode("table");
    } else if (mode === "notes") {
      setNotesViewMode("list");
    } else if (mode === "questions") {
      setQuestionsViewMode("table");
    } else if (mode === "collections") {
      setCollectionViewMode("table");
    } else if (mode === "agents") {
      setAgentViewMode("table");
    } else {
      setTechStackViewMode("table");
    }
  };

  const handlePhaseChange = (p: string[]) => {
    const setPhaseFilterFn = setPhaseFilter as (value: any[]) => void;
    if (mode === "questions") {
      setPhaseFilterFn(p.map((phase) => phase as Phases));
    } else {
      setPhaseFilterFn(p);
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row justify-between items-start gap-4"
      {...props}
    >
      {/* Phase filter pills */}
      <div className="w-full md:flex-1 overflow-x-auto">
        <div className="flex flex-wrap gap-2 pb-1" data-testid="phase-filter">
          {DEFAULT_PHASES.map((phase) => {
            const isSelected =
              phase === "All"
                ? phaseFilter.length === 0
                : phaseFilter.includes(phase);

            return (
              <Badge
                key={`${mode}-phase-${phase}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? `bg-black text-white`
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => handleTagClick(phase)}
                data-testid={`phase-badge-${phase.toLowerCase()}`}
              >
                {phase}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Search bar and view toggles */}
      <div className="flex gap-2 w-full md:w-auto">
        {/* Search bar */}
        <div className="relative md:w-[18rem] flex-shrink-0">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholderText}
            className="pl-10 pr-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              data-testid="clear-search-button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* View toggle buttons */}
        <div className="flex border rounded-md">
          <Button
            variant={
              (mode === "prompts" && promptViewMode === "card") ||
              (mode === "products" && productViewMode === "grid") ||
              (mode === "notes" && notesViewMode === "grid") ||
              (mode === "questions" && questionsViewMode === "grid") ||
              (mode === "collections" && collectionViewMode === "grid") ||
              (mode === "agents" && agentViewMode === "card") ||
              (mode === "techstack" && techStackViewMode === "card")
                ? "default"
                : "ghost"
            }
            size="icon"
            onClick={toggleGridView}
            className="rounded-r-none h-9 w-9"
            data-testid="card-view-button"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant={
              (mode === "prompts" && promptViewMode === "table") ||
              (mode === "products" && productViewMode === "table") ||
              (mode === "notes" && notesViewMode === "list") ||
              (mode === "questions" && questionsViewMode === "table") ||
              (mode === "collections" && collectionViewMode === "table") ||
              (mode === "agents" && agentViewMode === "table") ||
              (mode === "techstack" && techStackViewMode === "table")
                ? "default"
                : "ghost"
            }
            size="icon"
            onClick={toggleTableView}
            className="rounded-l-none h-9 w-9"
            data-testid="table-view-button"
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
