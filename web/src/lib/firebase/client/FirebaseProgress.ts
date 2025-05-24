import { getAuth } from 'firebase/auth';
import {
  getDoc,
  setDoc,
  updateDoc,
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
import { DEFAULT_PROGRESS, PROGRESS_COLLECTION, Progress } from '../schema/progress';
import { MainWizardStep, MiniWizardId } from '../schema/enums';

const progressConverter: FirestoreDataConverter<Progress> = {
  toFirestore: (progress) => progress,
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Progress {
    const data = snapshot.data(options) as Progress;
    return data;
  },
};

export class FirebaseProgress {
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
      this.collectionName = PROGRESS_COLLECTION;
    } catch (error) {
      console.error(
        "[FirebaseProgress][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }
  getProgressRef(userId: string): DocumentReference<Progress> {
    try {
      // Fixed: Using a valid document path with an odd number of segments
      // Format: collection/document or collection/document/collection/document
      return doc(this.db, this.collectionName, userId).withConverter(progressConverter);
    } catch (error) {
      console.error(`[FirebaseProgress] Error getting progress ref for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async getUserProgress(userId: string): Promise<Progress> {
    try {
      const progressSnap = await getDoc(this.getProgressRef(userId));
      
      if (progressSnap.exists()) {
        return progressSnap.data();
      } else {
        console.log(`[FirebaseProgress] No progress found for user ID: ${userId}, returning default`);
        return DEFAULT_PROGRESS;
      }
    } catch (error) {
      console.error(`[FirebaseProgress] Error getting progress for user ID: ${userId}`, error);
      return DEFAULT_PROGRESS;
    }
  }
  
  async initializeProgress(userId: string): Promise<void> {
    try {
      console.log(`[FirebaseProgress] Initializing progress for user with ID: ${userId}`);
      await setDoc(this.getProgressRef(userId), DEFAULT_PROGRESS);
      console.log(`[FirebaseProgress] Progress initialized for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseProgress] Error initializing progress for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async updateCurrentMiniWizard(userId: string, miniWizardId: MiniWizardId): Promise<void> {
    console.log(`[FirebaseProgress] Updating current mini wizard to ${miniWizardId} for user ID: ${userId}`);
    
    try {
      // First check if the document exists
      const docRef = this.getProgressRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(docRef, {
          currentMiniWizard: miniWizardId,
        });
      } else {
        // Document doesn't exist, create it with merge option
        await setDoc(docRef, {
          ...DEFAULT_PROGRESS,
          currentMiniWizard: miniWizardId,
        });
      }
      
      console.log(`[FirebaseProgress] Current mini wizard updated for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseProgress] Error updating current mini wizard for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async setMainWizardStep(userId: string, step: MainWizardStep): Promise<void> {
    console.log(`[FirebaseProgress] Setting main wizard step to ${step} for user ID: ${userId}`);
    
    try {
      // First check if the document exists
      const docRef = this.getProgressRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(docRef, {
          mainWizardStep: step,
        });
      } else {
        // Document doesn't exist, create it with merge option
        await setDoc(docRef, {
          ...DEFAULT_PROGRESS,
          mainWizardStep: step,
        });
      }
      
      console.log(`[FirebaseProgress] Main wizard step updated for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseProgress] Error updating main wizard step for user ID: ${userId}`, error);
      throw error;
    }
  }
  
  async updateUserProgress(userId: string, progress: {
    mainWizardStep: MainWizardStep,
    currentMiniWizard: MiniWizardId,
    completedMiniWizards: MiniWizardId[]
  }): Promise<void> {
    console.log(`[FirebaseProgress] Updating progress for user with ID: ${userId}`);
    
    try {
      // First check if the document exists
      const docRef = this.getProgressRef(userId);
      const docSnap = await getDoc(docRef);
      
      const updateData = {
        mainWizardStep: progress.mainWizardStep,
        currentMiniWizard: progress.currentMiniWizard,
        completedMiniWizards: progress.completedMiniWizards,
        percentComplete: Math.round((progress.completedMiniWizards.length / Object.values(MiniWizardId).length) * 100),
        lastUpdatedAt: Timestamp.now()
      };
      
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(docRef, updateData);
      } else {
        // Document doesn't exist, create it with merge option
        await setDoc(docRef, {
          ...DEFAULT_PROGRESS,
          ...updateData
        });
      }
      
      console.log(`[FirebaseProgress] Progress updated for user ID: ${userId}`);
    } catch (error) {
      console.error(`[FirebaseProgress] Error updating progress for user ID: ${userId}`, error);
      throw error;
    }
  }

  async completeMiniWizard(userId: string, miniWizardId: MiniWizardId): Promise<Progress> {
    console.log(`[FirebaseProgress] Completing mini wizard ${miniWizardId} for user ID: ${userId}`);
    
    try {
      const progressRef = this.getProgressRef(userId);
      const progressSnap = await getDoc(progressRef);
      
      const progressData = progressSnap.exists() 
        ? progressSnap.data() as Progress 
        : DEFAULT_PROGRESS;
      
      // Make sure we don't duplicate entries
      const completedWizards = Array.isArray(progressData.completedMiniWizards) && progressData.completedMiniWizards.includes(miniWizardId)
        ? progressData.completedMiniWizards
        : [...(Array.isArray(progressData.completedMiniWizards) ? progressData.completedMiniWizards : []), miniWizardId];
      
      const totalWizards = Object.values(MiniWizardId).length;
      const percentComplete = Math.round((completedWizards.length / totalWizards) * 100);
      
      const updatedProgress: Progress = {
        ...DEFAULT_PROGRESS,
        ...progressData,
        completedMiniWizards: completedWizards,
        percentComplete,
        lastCompletedAt: Timestamp.now(),
        success: true,
        xpAwarded: 50 // Default XP award
      };
      
      await setDoc(progressRef, updatedProgress);
      console.log(`[FirebaseProgress] Mini wizard completed for user ID: ${userId}, new progress: ${percentComplete}%`);
      
      return updatedProgress;
    } catch (error) {
      console.error(`[FirebaseProgress] Error completing mini wizard for user ID: ${userId}`, error);
      return {
        ...DEFAULT_PROGRESS,
        success: false,
        error: (error as Error).message
      };
    }
  }
}
