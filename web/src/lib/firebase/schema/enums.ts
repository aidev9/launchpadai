// Feature lock status enums
export enum MiniWizardId {
  CREATE_PRODUCT = "createProduct",
  CREATE_BUSINESS_STACK = "createBusinessStack",
  CREATE_TECHNICAL_STACK = "createTechnicalStack",
  CREATE_360_QUESTIONS_STACK = "create360QuestionsStack",
  CREATE_RULES_STACK = "createRulesStack",
  ADD_FEATURES = "addFeatures",
  ADD_COLLECTIONS = "addCollections",
  ADD_NOTES = "addNotes",
  GENERATE_PROMPT = "generatePrompt",
  GENERATE_ASSET = "generateAsset",
}

export enum MainWizardStep {
  // Main steps in the wizard
  INTRODUCTION = "introduction",
  MINI_WIZARDS = "mini_wizards",
  ARTIFACTS = "artifacts",
  COMPLETION = "completion",
}

export enum AchievementType {
  STEP_COMPLETION = "stepCompletion",
  XP_MILESTONE = "xpMilestone",
  STREAK = "streak",
  FEATURE_UNLOCK = "featureUnlock",
}

export enum BadgeType {
  STARTER = "starter",
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
}

// XP thresholds for unlocking features
export const UNLOCK_THRESHOLDS: Record<MiniWizardId, number> = {
  [MiniWizardId.CREATE_PRODUCT]: 0, // Initially unlocked
  [MiniWizardId.CREATE_BUSINESS_STACK]: 50,
  [MiniWizardId.CREATE_TECHNICAL_STACK]: 100,
  [MiniWizardId.CREATE_360_QUESTIONS_STACK]: 150,
  [MiniWizardId.CREATE_RULES_STACK]: 200,
  [MiniWizardId.ADD_FEATURES]: 250,
  [MiniWizardId.ADD_COLLECTIONS]: 300,
  [MiniWizardId.ADD_NOTES]: 350,
  [MiniWizardId.GENERATE_PROMPT]: 400, // First Artifacts step
  [MiniWizardId.GENERATE_ASSET]: 450,
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  2000, // Level 6
];

// Calculate user level based on XP
export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}
