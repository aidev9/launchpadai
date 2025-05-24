import { getAuth } from 'firebase/auth';
import { 
  getDoc, 
  setDoc, 
  updateDoc,
  doc,
  DocumentReference,
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { clientApp, clientAuth, clientDb } from '@/lib/firebase/client';
import { DEFAULT_FEATURE_LOCKS, FEATURE_LOCKS_COLLECTION, FeatureLocks } from '../schema/featureLocks';
import { MiniWizardId, UNLOCK_THRESHOLDS } from '../schema/enums';

const featureLocksConverter: FirestoreDataConverter<FeatureLocks> = {
  toFirestore: (featureLocks) => featureLocks,
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): FeatureLocks {
    const data = snapshot.data(options) as FeatureLocks;
    return data;
  },
};

export class FirebaseFeatureLocks {
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

      // Add debugging to log the database name
      console.log(
        "[FirebaseFeatureLocks] Using database:",
        process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
      );

      this.storage = getStorage(clientApp);
      this.collectionName = FEATURE_LOCKS_COLLECTION;
    } catch (error) {
      console.error(
        "[FirebaseFeatureLocks][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }
  getFeatureLocksRef(userId: string): DocumentReference<FeatureLocks> {
    try {
      return doc(this.db, this.collectionName, userId, 'featureLocks', 'featureLocks').withConverter(featureLocksConverter);
    } catch (error) {
      console.error(`[FirebaseFeatureLocks] Error getting feature locks ref for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async getFeatureLocks(userId: string): Promise<FeatureLocks> {
    try {
      console.log(`[FirebaseFeatureLocks] Getting feature locks for user with ID: ${userId}`);
      const locksSnap = await getDoc(this.getFeatureLocksRef(userId));
      
      if (locksSnap.exists()) {
        console.log(`[FirebaseFeatureLocks] Feature locks found for user ID: ${userId}`);
        return locksSnap.data();
      } else {
        console.log(`[FirebaseFeatureLocks] No feature locks found for user ID: ${userId}, returning default`);
        return DEFAULT_FEATURE_LOCKS;
      }
    } catch (error) {
      console.error(`[FirebaseFeatureLocks] Error getting feature locks for user ID: ${userId}`, error);
      return DEFAULT_FEATURE_LOCKS;
    }
  }
  
  async initializeFeatureLocks(userId: string): Promise<void> {
    try {
      console.log(`[FirebaseFeatureLocks] Initializing feature locks for user with ID: ${userId}`);
      await setDoc(this.getFeatureLocksRef(userId), DEFAULT_FEATURE_LOCKS);
      console.log(`[FirebaseFeatureLocks] Feature locks initialized for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseFeatureLocks] Error initializing feature locks for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async isFeatureUnlocked(userId: string, featureId: MiniWizardId): Promise<boolean> {
    console.log(`[FirebaseFeatureLocks] Checking if feature ${featureId} is unlocked for user ID: ${userId}`);
    const locksSnap = await getDoc(this.getFeatureLocksRef(userId));
    
    if (!locksSnap.exists()) {
      console.log(`[FirebaseFeatureLocks] No feature locks found, defaulting to only first step unlocked`);
      return featureId === MiniWizardId.CREATE_PRODUCT; // Only first step is unlocked by default
    }
    
    const isUnlocked = locksSnap.data().lockedStatus[featureId] === false;
    console.log(`[FirebaseFeatureLocks] Feature ${featureId} is ${isUnlocked ? 'unlocked' : 'locked'} for user ID: ${userId}`);
    return isUnlocked;
  }
  
  // Calculate the next unlock threshold based on current XP
  private getNextUnlockThreshold(currentXp: number): number | null {
    const thresholds = Object.values(UNLOCK_THRESHOLDS).sort((a, b) => a - b);
    
    for (const threshold of thresholds) {
      if (threshold > currentXp) {
        return threshold;
      }
    }
    
    return null; // All features unlocked
  }
  
  // Update unlocked features based on current XP
  async updateUnlockedFeatures(userId: string, currentXp: number): Promise<MiniWizardId[]> {
    console.log(`[FirebaseFeatureLocks] Updating unlocked features for user ID: ${userId} with current XP: ${currentXp}`);
    const locksSnap = await getDoc(this.getFeatureLocksRef(userId));
    
    const locksData = locksSnap.exists() 
      ? locksSnap.data() 
      : DEFAULT_FEATURE_LOCKS;
    
    const unlockedFeatures: MiniWizardId[] = [...locksData.unlockedFeatures];
    const lockedStatus = { ...locksData.lockedStatus };
    const newlyUnlocked: MiniWizardId[] = [];
    
    // Check which features should be unlocked based on XP
    for (const [feature, threshold] of Object.entries(UNLOCK_THRESHOLDS)) {
      const featureId = feature as MiniWizardId;
      
      if (currentXp >= threshold && !unlockedFeatures.includes(featureId)) {
        console.log(`[FirebaseFeatureLocks] Unlocking feature ${featureId} for user ID: ${userId}`);
        unlockedFeatures.push(featureId);
        lockedStatus[featureId] = false;
        newlyUnlocked.push(featureId);
      }
    }
    
    // Only update if there are newly unlocked features
    if (newlyUnlocked.length > 0) {
      const nextThreshold = this.getNextUnlockThreshold(currentXp);
      console.log(`[FirebaseFeatureLocks] Next unlock threshold: ${nextThreshold}`);
      
      await updateDoc(this.getFeatureLocksRef(userId), {
        unlockedFeatures,
        lockedStatus,
        nextUnlockThreshold: nextThreshold
      });
      console.log(`[FirebaseFeatureLocks] Feature locks updated for user ID: ${userId}`);
    } else {
      console.log(`[FirebaseFeatureLocks] No new features to unlock for user ID: ${userId}`);
    }
    
    return newlyUnlocked;
  }
}
