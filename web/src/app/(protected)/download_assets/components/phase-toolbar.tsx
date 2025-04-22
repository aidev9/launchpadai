"use client";

import { useAtom } from "jotai";
import { atom } from "jotai";
import { phases } from "../data/assets";

// Create an atom to store the selected phases
export const selectedPhasesAtom = atom<string[]>(["All"]);

// All phases including the "All" option
const allPhaseOptions = ["All", ...phases];

export function PhaseToolbar() {
  const [selectedPhases, setSelectedPhases] = useAtom(selectedPhasesAtom);

  const handlePhaseToggle = (phase: string) => {
    if (phase === "All") {
      // If "All" is clicked, select only "All"
      setSelectedPhases(["All"]);
      return;
    }

    // Start with current selection, removing "All" if it exists
    let newSelection = selectedPhases.filter((p) => p !== "All");

    if (newSelection.includes(phase)) {
      // Remove phase if it's already selected
      newSelection = newSelection.filter((p) => p !== phase);

      // If no phases are selected, default to "All"
      if (newSelection.length === 0) {
        newSelection = ["All"];
      }
    } else {
      // Add phase if it's not already selected
      newSelection.push(phase);
    }

    setSelectedPhases(newSelection);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Filter by Phase</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {allPhaseOptions.map((phase) => (
            <button
              key={phase}
              onClick={() => handlePhaseToggle(phase)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors 
                ${
                  selectedPhases.includes(phase)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
