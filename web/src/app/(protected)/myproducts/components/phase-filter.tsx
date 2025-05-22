"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PhaseFilterProps {
  selectedPhases: string[];
  onChange: (phases: string[]) => void;
}

// Define phase colors
export const getPhaseColor = (phase: string): string => {
  const colors: Record<string, string> = {
    All: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
    Discover:
      "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100",
    Validate:
      "bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100",
    Design:
      "bg-pink-100 hover:bg-pink-200 text-pink-800 dark:bg-pink-900 dark:hover:bg-pink-800 dark:text-pink-100",
    Build:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-100",
    Secure:
      "bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100",
    Launch:
      "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100",
    Grow: "bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:hover:bg-cyan-800 dark:text-cyan-100",
  };

  return colors[phase] || colors["All"];
};

// Phase list
export const PHASES = [
  "All",
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];

export function PhaseFilter({ selectedPhases, onChange }: PhaseFilterProps) {
  const handleTagClick = (phase: string) => {
    if (phase === "All") {
      // If "All" is clicked, clear all filters
      onChange([]);
      return;
    }

    let newSelectedPhases: string[];

    if (selectedPhases.includes(phase)) {
      // If the phase is already selected, remove it
      newSelectedPhases = selectedPhases.filter((p) => p !== phase);
    } else {
      // Otherwise, add it to the selection
      newSelectedPhases = [...selectedPhases, phase];
    }

    onChange(newSelectedPhases);
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid="phase-filter">
      {PHASES.map((phase) => {
        const isSelected =
          phase === "All"
            ? selectedPhases.length === 0
            : selectedPhases.includes(phase);

        return (
          <Badge
            key={phase}
            className={cn(
              "cursor-pointer px-3 py-1 font-medium",
              getPhaseColor(phase),
              isSelected ? "ring-2 ring-offset-1" : "opacity-80"
            )}
            variant="outline"
            onClick={() => handleTagClick(phase)}
            data-testid={`phase-badge-${phase.toLowerCase()}`}
          >
            {phase}
          </Badge>
        );
      })}
    </div>
  );
}
