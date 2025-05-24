import { MiniWizardId } from "./enums";

export interface FeatureLocks {
  unlockedFeatures: MiniWizardId[];
  nextUnlockThreshold: number | null;
  lockedStatus: Record<MiniWizardId, boolean>;
}

export const DEFAULT_FEATURE_LOCKS: FeatureLocks = {
  unlockedFeatures: [MiniWizardId.CREATE_PRODUCT],
  nextUnlockThreshold: 50, // Next threshold after createProduct
  lockedStatus: {
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
  },
};

export const FEATURE_LOCKS_COLLECTION = "featureLocks";
