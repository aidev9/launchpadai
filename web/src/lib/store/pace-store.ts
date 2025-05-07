import { atom } from "jotai";
import { Prompt, PromptInput } from "@/lib/firebase/schema";

/**
 * Interface for problem suggestions with label and body
 */
export interface ProblemSuggestion {
  label: string;
  body: string;
}

/**
 * Interface for ask suggestions with label and body
 */
export interface AskSuggestion {
  label: string;
  body: string;
}

/**
 * Type definition for the PACE wizard state
 */
export interface PaceWizardState {
  problem: string;
  ask: string;
  chainVariations: string[];
  precisionScore: number;
  definitionScore: number;
  finalPrompt: string;
  title: string;
  phase: string[];
  tags: string[];
  unifiedPrompt: string; // Single prompt that is carried across all steps
  instructions: string; // Additional instructions for the AI
}

/**
 * Default state for the PACE wizard
 */
const defaultPaceWizardState: PaceWizardState = {
  problem: "",
  ask: "",
  chainVariations: ["", ""],
  precisionScore: 0,
  definitionScore: 0,
  finalPrompt: "",
  title: "",
  phase: [],
  tags: [],
  unifiedPrompt: "",
  instructions: "",
};

/**
 * Atom for tracking the current step in the PACE wizard
 */
export const currentPaceStepAtom = atom<number>(1);

/**
 * Atom for storing the PACE wizard state
 */
export const paceWizardStateAtom = atom<PaceWizardState>(
  defaultPaceWizardState
);

/**
 * Atom for tracking if the wizard is in edit mode
 */
export const isEditModeAtom = atom<boolean>(false);

/**
 * Atom for tracking if AI suggestions are loading
 */
export const suggestionsLoadingAtom = atom<boolean>(false);

/**
 * Atom for storing problem suggestions
 */
export const problemSuggestionsAtom = atom<ProblemSuggestion[]>([]);

/**
 * Atom for storing ask suggestions
 */
export const askSuggestionsAtom = atom<AskSuggestion[]>([]);

/**
 * Helper function to convert PACE wizard state to a prompt input
 */
export function paceStateToPromptInput(state: PaceWizardState): PromptInput {
  return {
    title: state.title,
    body: state.finalPrompt || generateFinalPrompt(state),
    phaseTags: state.phase,
    productTags: [],
    tags: [...state.tags, "pace"],
  };
}

/**
 * Helper function to generate the final prompt from the PACE state
 */
function generateFinalPrompt(state: PaceWizardState): string {
  // If we have a unified prompt, use it directly
  if (state.unifiedPrompt.trim()) {
    let finalPrompt = state.unifiedPrompt;

    // Add instructions if they exist
    if (state.instructions.trim()) {
      finalPrompt += `\n\n## Instructions\n${state.instructions}`;
    }

    return finalPrompt;
  }

  // Otherwise, build the prompt from individual components
  let prompt = `# PACE Framework Prompt

## Problem
${state.problem}

## Ask
${state.ask}

## Chain
${state.chainVariations.filter((v) => v.trim()).join("\n\n")}`;

  // Add instructions if they exist
  if (state.instructions.trim()) {
    prompt += `\n\n## Instructions\n${state.instructions}`;
  }

  prompt += `\n\nThis prompt was created using the PACE framework.`;

  return prompt;
}

/**
 * Reset the PACE wizard state
 */
export const resetPaceWizardAtom = atom(null, (get, set) => {
  set(currentPaceStepAtom, 1);
  set(paceWizardStateAtom, defaultPaceWizardState);
  set(isEditModeAtom, false);
  set(problemSuggestionsAtom, []);
  set(askSuggestionsAtom, []);
});

/**
 * Update a specific field in the PACE wizard state
 */
export const updatePaceFieldAtom = atom(
  null,
  (get, set, update: Partial<PaceWizardState>) => {
    const currentState = get(paceWizardStateAtom);
    set(paceWizardStateAtom, { ...currentState, ...update });
  }
);
