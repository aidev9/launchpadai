"use client";

import { useAtom } from "jotai";
import { selectedAssetPhasesAtom } from "@/lib/store/assets-store";

// Define all possible phases statically
const phases = [
  "All",
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];

export function PhaseToolbar() {
  const [selectedPhases, setSelectedPhases] = useAtom(selectedAssetPhasesAtom);

  const handlePhaseToggle = (phase: string) => {
    // If "All" is selected, clear other selections
    if (phase === "All") {
      setSelectedPhases(["All"]);
      return;
    }

    // If a phase other than "All" is selected, remove "All" from the selection
    let newSelection = selectedPhases.filter((p) => p !== "All");

    // Toggle the selected phase
    if (newSelection.includes(phase)) {
      // Remove the phase if it's already selected
      newSelection = newSelection.filter((p) => p !== phase);

      // If no phases are selected, default to "All"
      if (newSelection.length === 0) {
        newSelection = ["All"];
      }
    } else {
      // Add the phase if it's not already selected
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
          {phases.map((phase) => (
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
