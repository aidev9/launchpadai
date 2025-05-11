"use client";

import { useAtom } from "jotai";
import {
  allQuestionsAtom,
  selectedPhasesAtom,
} from "@/lib/store/questions-store";

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
  const [selectedPhases, setSelectedPhases] = useAtom(selectedPhasesAtom);
  const [allQuestions] = useAtom(allQuestionsAtom);

  // Count answered questions per phase
  const phaseStats = phases.reduce(
    (acc, phase) => {
      if (phase === "All") {
        const totalAnswered = allQuestions.filter(
          (q) => q.answer && q.answer.trim().length > 0
        ).length;
        acc[phase] = { total: allQuestions.length, answered: totalAnswered };
      } else {
        const phaseQuestions = allQuestions.filter((q) => {
          return (
            q.phases && Array.isArray(q.phases) && q.phases.includes(phase)
          );
        });
        const answeredCount = phaseQuestions.filter(
          (q) => q.answer && q.answer.trim().length > 0
        ).length;
        acc[phase] = { total: phaseQuestions.length, answered: answeredCount };
      }
      return acc;
    },
    {} as Record<string, { total: number; answered: number }>
  );

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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                ${
                  selectedPhases.includes(phase)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {phase}
              <span
                className={`text-xs ${selectedPhases.includes(phase) ? "text-primary-foreground/80" : "text-secondary-foreground/80"}`}
              >
                {phaseStats[phase]?.answered || 0}/
                {phaseStats[phase]?.total || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
