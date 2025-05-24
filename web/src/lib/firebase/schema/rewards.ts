import { Timestamp } from 'firebase/firestore';
import { AchievementType, BadgeType, MiniWizardId } from './enums';

export interface XpHistoryEntry {
  step: MiniWizardId;
  xp: number;
  timestamp: Timestamp;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  xpAwarded: number;
  unlockedAt: Timestamp;
}

export interface Badge {
  id: string;
  type: BadgeType;
  title: string;
  description: string;
  imageUrl: string;
  unlockedAt: Timestamp;
}

export interface Rewards {
  xpHistory: XpHistoryEntry[];
  achievements: Achievement[];
  badges: Badge[];
  streaks: number;
}

export const DEFAULT_REWARDS: Rewards = {
  xpHistory: [],
  achievements: [],
  badges: [],
  streaks: 0,
};

export const REWARDS_COLLECTION = 'rewards';
