import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  MainWizardStep,
  MiniWizardId,
  UNLOCK_THRESHOLDS,
} from "../firebase/schema/enums";

// ==============================
// NEW GLOBAL WIZARD NAVIGATION SYSTEM
// ==============================

// Global wizard step as [mainStep, subStep]
// mainStep: 0=intro, 1=product, 2=business, 3=tech, 4=questions, 5=rules, 6=features, 7=collections, 8=notes, 9=completion
// subStep: current step within that wizard (1-based)
export type GlobalWizardStep = [number, number];

// Default starting position: Introduction step 1
export const globalWizardStepAtom = atomWithStorage<GlobalWizardStep>(
  "globalWizardStep",
  [0, 1]
);

// Wizard step definitions - defines how many steps each wizard has
export const WIZARD_STEP_DEFINITIONS = {
  0: { id: "introduction", title: "Introduction", totalSteps: 4 }, // [0, 1-4]
  1: { id: "product", title: "Create Product", totalSteps: 3 }, // [1, 1-3]
  2: { id: "business", title: "Create Business Stack", totalSteps: 3 }, // [2, 1-3]
  3: { id: "tech", title: "Create Tech Stack", totalSteps: 10 }, // [3, 1-10]
  4: { id: "questions", title: "Answer 360 Questions", totalSteps: 7 }, // [4, 1-7]
  5: { id: "rules", title: "Create Rules Stack", totalSteps: 7 }, // [5, 1-7]
  6: { id: "features", title: "Add Features", totalSteps: 1 }, // [6, 1]
  7: { id: "collections", title: "Add Collections", totalSteps: 1 }, // [7, 1]
  8: { id: "notes", title: "Add Notes", totalSteps: 1 }, // [8, 1]
  9: { id: "completion", title: "Completion", totalSteps: 1 }, // [9, 1]
} as const;

// Total number of wizards
export const TOTAL_WIZARDS = Object.keys(WIZARD_STEP_DEFINITIONS).length;

// Navigation helper functions
export const wizardNavigationAtom = atom(
  (get) => get(globalWizardStepAtom),
  (get, set, action: "next" | "back" | GlobalWizardStep) => {
    const currentStep = get(globalWizardStepAtom);
    const [mainStep, subStep] = currentStep;

    if (typeof action === "object") {
      // Direct step setting
      set(globalWizardStepAtom, action);
      return;
    }

    const currentWizard =
      WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];

    if (action === "next") {
      // Check if we can go to next sub-step within current wizard
      if (subStep < currentWizard.totalSteps) {
        set(globalWizardStepAtom, [mainStep, subStep + 1]);
      } else {
        // Move to next main wizard
        if (mainStep < TOTAL_WIZARDS - 1) {
          set(globalWizardStepAtom, [mainStep + 1, 1]);
        }
        // If already at last wizard and last step, stay there
      }
    } else if (action === "back") {
      // Check if we can go to previous sub-step within current wizard
      if (subStep > 1) {
        set(globalWizardStepAtom, [mainStep, subStep - 1]);
      } else {
        // Move to previous main wizard's last step
        if (mainStep > 0) {
          const prevWizard =
            WIZARD_STEP_DEFINITIONS[
              (mainStep - 1) as keyof typeof WIZARD_STEP_DEFINITIONS
            ];
          set(globalWizardStepAtom, [mainStep - 1, prevWizard.totalSteps]);
        }
        // If already at first wizard and first step, stay there
      }
    }
  }
);

// Helper to get current wizard info
export const currentWizardInfoAtom = atom((get) => {
  const [mainStep, subStep] = get(globalWizardStepAtom);
  const wizard =
    WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];

  return {
    mainStep,
    subStep,
    wizard,
    isFirstStep: mainStep === 0 && subStep === 1,
    isLastStep: mainStep === TOTAL_WIZARDS - 1 && subStep === wizard.totalSteps,
    progress: {
      current: mainStep + 1,
      total: TOTAL_WIZARDS,
      percentage:
        ((mainStep + subStep / wizard.totalSteps) / TOTAL_WIZARDS) * 100,
    },
  };
});

// Helper to check if navigation is allowed
export const canNavigateAtom = atom((get) => {
  const [mainStep, subStep] = get(globalWizardStepAtom);
  const currentWizard =
    WIZARD_STEP_DEFINITIONS[mainStep as keyof typeof WIZARD_STEP_DEFINITIONS];

  return {
    canGoBack: !(mainStep === 0 && subStep === 1),
    canGoNext: !(
      mainStep === TOTAL_WIZARDS - 1 && subStep === currentWizard.totalSteps
    ),
  };
});

// ==============================
// EXISTING ATOMS (for backward compatibility)
// ==============================

// Core wizard state atoms
export const mainWizardStepAtom = atomWithStorage<MainWizardStep>(
  "mainWizardStep",
  MainWizardStep.INTRODUCTION
);
export const currentMiniWizardAtom = atomWithStorage<MiniWizardId>(
  "currentMiniWizard",
  MiniWizardId.CREATE_PRODUCT
);
export const completedMiniWizardsAtom = atomWithStorage<MiniWizardId[]>(
  "completedMiniWizards",
  []
);
export const percentCompleteAtom = atomWithStorage<number>(
  "percentComplete",
  0
);

// Feature locks atoms
export const unlockedFeaturesAtom = atomWithStorage<MiniWizardId[]>(
  "unlockedFeatures",
  [MiniWizardId.CREATE_PRODUCT]
);
export const lockedStatusAtom = atomWithStorage<Record<MiniWizardId, boolean>>(
  "lockedStatus",
  {
    [MiniWizardId.CREATE_PRODUCT]: false, // Initially unlocked
    [MiniWizardId.CREATE_BUSINESS_STACK]: true,
    [MiniWizardId.CREATE_TECHNICAL_STACK]: true,
    [MiniWizardId.CREATE_360_QUESTIONS_STACK]: true,
    [MiniWizardId.CREATE_RULES_STACK]: true,
    [MiniWizardId.ADD_FEATURES]: true,
    [MiniWizardId.ADD_COLLECTIONS]: true,
    [MiniWizardId.ADD_NOTES]: true,
    [MiniWizardId.GENERATE_PROMPT]: true,
    [MiniWizardId.GENERATE_ASSET]: true,
  }
);

// XP and rewards atoms
export const totalXpAtom = atomWithStorage<number>("totalXp", 0);
export const xpHistoryAtom = atomWithStorage<any[]>("xpHistory", []);

// Celebration state atom
export const celebrationAtom = atom<{
  show: boolean;
  miniWizardId?: MiniWizardId;
  xpEarned?: number;
  message?: string;
}>({
  show: false,
});

// Derived atom for next unlockable feature
export const nextUnlockableFeatureAtom = atom((get) => {
  const totalXp = get(totalXpAtom);
  const unlockedFeatures = get(unlockedFeaturesAtom);

  // Find next feature to unlock
  for (const [feature, threshold] of Object.entries(UNLOCK_THRESHOLDS)) {
    const featureId = feature as MiniWizardId;
    if (!unlockedFeatures.includes(featureId) && threshold > totalXp) {
      return {
        feature: featureId,
        threshold,
        xpNeeded: threshold - totalXp,
      };
    }
  }

  return null; // All features unlocked
});

// Mini wizard definitions with metadata
export interface MiniWizardDefinition {
  id: MiniWizardId;
  title: string;
  description: string;
  xpReward: number;
  mainStep: MainWizardStep;
  order: number;
}

export const MINI_WIZARDS: MiniWizardDefinition[] = [
  {
    id: MiniWizardId.CREATE_PRODUCT,
    title: "Create a Product",
    description: "Define your product to create context for AI generation",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 1,
  },
  {
    id: MiniWizardId.CREATE_BUSINESS_STACK,
    title: "Create Business Stack",
    description: "Define the business stack for your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 2,
  },
  {
    id: MiniWizardId.CREATE_TECHNICAL_STACK,
    title: "Create Technical Stack",
    description: "Define the technical stack for your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 3,
  },
  {
    id: MiniWizardId.CREATE_360_QUESTIONS_STACK,
    title: "Create 360 Questions",
    description: "Create comprehensive questions about your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 4,
  },
  {
    id: MiniWizardId.CREATE_RULES_STACK,
    title: "Create Rules Stack",
    description: "Define rules and constraints for your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 5,
  },
  {
    id: MiniWizardId.ADD_FEATURES,
    title: "Add Features",
    description: "Add features to your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 6,
  },
  {
    id: MiniWizardId.ADD_COLLECTIONS,
    title: "Add Collections",
    description: "Create collections and upload documents for your product",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 7,
  },
  {
    id: MiniWizardId.ADD_NOTES,
    title: "Add Notes",
    description: "Add important notes and reminders",
    xpReward: 50,
    mainStep: MainWizardStep.MINI_WIZARDS,
    order: 8,
  },
  {
    id: MiniWizardId.GENERATE_PROMPT,
    title: "Generate Prompt",
    description: "Generate an AI prompt based on your product",
    xpReward: 75,
    mainStep: MainWizardStep.ARTIFACTS,
    order: 9,
  },
  {
    id: MiniWizardId.GENERATE_ASSET,
    title: "Generate Asset",
    description: "Generate assets for your product",
    xpReward: 75,
    mainStep: MainWizardStep.ARTIFACTS,
    order: 10,
  },
];

// Get the next mini wizard after completing the current one
export function getNextMiniWizard(
  currentId: MiniWizardId
): MiniWizardId | null {
  const currentIndex = MINI_WIZARDS.findIndex(
    (wizard) => wizard.id === currentId
  );
  if (currentIndex === -1 || currentIndex === MINI_WIZARDS.length - 1) {
    return null;
  }
  return MINI_WIZARDS[currentIndex + 1].id;
}
