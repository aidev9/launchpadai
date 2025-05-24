import { getAuth } from 'firebase/auth';
import { 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  Timestamp,
  doc,
  DocumentReference,
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { clientApp, clientAuth, clientDb } from '@/lib/firebase/client';
import { DEFAULT_REWARDS, REWARDS_COLLECTION, Rewards, XpHistoryEntry } from '../schema/rewards';
import { AchievementType, BadgeType, MiniWizardId } from '../schema/enums';

const rewardsConverter: FirestoreDataConverter<Rewards> = {
  toFirestore: (rewards) => rewards,
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Rewards {
    const data = snapshot.data(options) as Rewards;
    return data;
  },
};

export class FirebaseRewards {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  collectionName: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);
      this.collectionName = REWARDS_COLLECTION;
    } catch (error) {
      console.error(
        "[FirebaseRewards][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }
  getRewardsRef(userId: string): DocumentReference<Rewards> {
    try {
      // Use nested collection pattern: rewards/{userId}/rewards/data
      // This follows the pattern used in other collections in the project
      return doc(this.db, this.collectionName, userId, 'rewards', 'data').withConverter(rewardsConverter);
    } catch (error) {
      console.error(`[FirebaseRewards] Error getting rewards ref for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async getUserRewards(userId: string): Promise<Rewards> {
    return this.getRewards(userId);
  }
  
  async getRewards(userId: string): Promise<Rewards> {
    try {
      const rewardsSnap = await getDoc(this.getRewardsRef(userId));
      
      if (rewardsSnap.exists()) {
        return rewardsSnap.data();
      } else {
        console.log(`[FirebaseRewards] No rewards found for user ID: ${userId}, returning default`);
        return DEFAULT_REWARDS;
      }
    } catch (error) {
      console.error(`[FirebaseRewards] Error getting rewards for user ID: ${userId}`, error);
      return DEFAULT_REWARDS;
    }
  }
  
  async initializeRewards(userId: string): Promise<void> {
    try {
      console.log(`[FirebaseRewards] Initializing rewards for user with ID: ${userId}`);
      await setDoc(this.getRewardsRef(userId), DEFAULT_REWARDS);
      console.log(`[FirebaseRewards] Rewards initialized for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseRewards] Error initializing rewards for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async addXpHistoryItem(userId: string, xpItem: { amount: number, step: MiniWizardId, timestamp: Date }): Promise<void> {
    try {
      console.log(`[FirebaseRewards] Adding XP history item for user ID: ${userId}, amount: ${xpItem.amount}, step: ${xpItem.step}`);
      
      // Get current rewards to update total XP
      const rewards = await this.getRewards(userId);
      const newTotalXp = (rewards.xpHistory.reduce((totalXp, entry) => totalXp + entry.xp, 0) || 0) + xpItem.amount;
      
      const entry: XpHistoryEntry = {
        xp: xpItem.amount,
        step: xpItem.step,
        timestamp: Timestamp.fromDate(xpItem.timestamp),
      };
      
      await updateDoc(this.getRewardsRef(userId), {
        xpHistory: arrayUnion(entry),
        totalXp: newTotalXp,
        lastUpdatedAt: Timestamp.now()
      });
      
      console.log(`[FirebaseRewards] XP history item added for user ID: ${userId}, new total XP: ${newTotalXp}`);
    } catch (error) {
      console.error(`[FirebaseRewards] Error adding XP history item for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async addXpHistoryEntry(
    userId: string, 
    step: MiniWizardId, 
    xp: number
  ): Promise<void> {
    console.log(`[FirebaseRewards] Adding XP history entry for user ID: ${userId}, step: ${step}, XP: ${xp}`);
    const entry: XpHistoryEntry = {
      step,
      xp,
      timestamp: Timestamp.now(),
    };
    
    await updateDoc(this.getRewardsRef(userId), {
      xpHistory: arrayUnion(entry)
    });
    console.log(`[FirebaseRewards] XP history entry added for user ID: ${userId}`);
  }
  
  async addAchievement(
    userId: string,
    type: AchievementType,
    title: string,
    description: string,
    xpAwarded: number
  ): Promise<void> {
    console.log(`[FirebaseRewards] Adding achievement for user ID: ${userId}, type: ${type}, title: ${title}`);
    const achievement = {
      id: `${type}_${Date.now()}`,
      type,
      title,
      description,
      xpAwarded,
      unlockedAt: Timestamp.now()
    };
    
    await updateDoc(this.getRewardsRef(userId), {
      achievements: arrayUnion(achievement)
    });
    console.log(`[FirebaseRewards] Achievement added for user ID: ${userId}`);
  }
  
  async addBadge(
    userId: string,
    type: BadgeType,
    title: string,
    description: string,
    imageUrl: string
  ): Promise<void> {
    console.log(`[FirebaseRewards] Adding badge for user ID: ${userId}, type: ${type}, title: ${title}`);
    const badge = {
      id: `${type}_${Date.now()}`,
      type,
      title,
      description,
      imageUrl,
      unlockedAt: Timestamp.now()
    };
    
    await updateDoc(this.getRewardsRef(userId), {
      badges: arrayUnion(badge)
    });
    console.log(`[FirebaseRewards] Badge added for user ID: ${userId}`);
  }
  
  async incrementStreak(userId: string): Promise<number> {
    console.log(`[FirebaseRewards] Incrementing streak for user ID: ${userId}`);
    const rewardsSnap = await getDoc(this.getRewardsRef(userId));
    
    if (!rewardsSnap.exists()) {
      console.log(`[FirebaseRewards] No rewards found, initializing with streak = 1`);
      await this.initializeRewards(userId);
      return 1;
    }
    
    const rewards = rewardsSnap.data();
    const newStreakCount = rewards.streaks + 1;
    
    await updateDoc(this.getRewardsRef(userId), {
      streaks: newStreakCount
    });
    
    console.log(`[FirebaseRewards] Streak incremented for user ID: ${userId}, new streak: ${newStreakCount}`);
    return newStreakCount;
  }
  
  async resetStreak(userId: string): Promise<void> {
    console.log(`[FirebaseRewards] Resetting streak for user ID: ${userId}`);
    await updateDoc(this.getRewardsRef(userId), {
      streaks: 0
    });
    console.log(`[FirebaseRewards] Streak reset for user ID: ${userId}`);
  }
}
