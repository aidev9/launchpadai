import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-wrap gap-2">
      {PHASE_OPTIONS.map((phase) => {
        const isSelected =
          (phase === "All" && selectedPhases.length === 0) ||
          (phase !== "All" && selectedPhases.includes(phase));

        return (
          <Badge
            key={phase}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer ${
              isSelected ? getPhaseColor(phase) : ""
            }`}
            onClick={() => handlePhaseClick(phase)}
          >
            {phase}
          </Badge>
        );
      })}
    </div>
  );
}
