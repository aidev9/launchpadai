import { Button } from "@/components/ui/button";

interface PhaseFilterProps {
  selectedPhases: string[];
  onChange: (phases: string[]) => void;
}

// Phase options for filtering
const PHASE_OPTIONS = [
  "All",
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];

// Colors for each phase
export const getPhaseColor = (phase: string) => {
  switch (phase) {
    case "All":
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    case "Discover":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "Validate":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    case "Design":
      return "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20";
    case "Build":
      return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
    case "Secure":
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    case "Launch":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    case "Grow":
      return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
};

// Get the ring color for selected phases
export const getPhaseRingColor = (phase: string) => {
  switch (phase) {
    case "All":
      return "ring-2 ring-gray-500";
    case "Discover":
      return "ring-2 ring-blue-500";
    case "Validate":
      return "ring-2 ring-purple-500";
    case "Design":
      return "ring-2 ring-pink-500";
    case "Build":
      return "ring-2 ring-amber-500";
    case "Secure":
      return "ring-2 ring-red-500";
    case "Launch":
      return "ring-2 ring-green-500";
    case "Grow":
      return "ring-2 ring-orange-500";
    default:
      return "ring-2 ring-gray-500";
  }
};

export function PhaseFilter({ selectedPhases, onChange }: PhaseFilterProps) {
  const handlePhaseClick = (phase: string) => {
    if (phase === "All") {
      // If "All" is clicked, clear all selections
      onChange([]);
    } else {
      // Toggle the selected phase
      if (selectedPhases.includes(phase)) {
        onChange(selectedPhases.filter((p) => p !== phase));
      } else {
        onChange([...selectedPhases, phase]);
      }
    }
  };

  return (
    <div className="flex gap-2 w-max md:w-auto">
      {PHASE_OPTIONS.map((phase) => {
        const isSelected =
          (phase === "All" && selectedPhases.length === 0) ||
          (phase !== "All" && selectedPhases.includes(phase));

        return (
          <button
            key={phase}
            onClick={() => handlePhaseClick(phase)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              isSelected
                ? `bg-black text-white`
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {phase}
          </button>
        );
      })}
    </div>
  );
}
