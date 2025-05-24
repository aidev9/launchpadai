import { Timestamp } from 'firebase/firestore';
import { MainWizardStep, MiniWizardId } from './enums';

export interface Progress {
  mainWizardStep: MainWizardStep;
  currentMiniWizard: MiniWizardId;
  completedMiniWizards: MiniWizardId[];
  percentComplete: number;
  lastCompletedAt: Timestamp | null;
  // Response properties
  success?: boolean;
  xpAwarded?: number;
  error?: string;
}

export const DEFAULT_PROGRESS: Progress = {
  mainWizardStep: MainWizardStep.INTRODUCTION,
  currentMiniWizard: MiniWizardId.CREATE_PRODUCT,
  completedMiniWizards: [],
  percentComplete: 0,
  lastCompletedAt: null,
};

export const PROGRESS_COLLECTION = 'progress';
