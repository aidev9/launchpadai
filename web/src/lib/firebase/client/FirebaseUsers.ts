import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  setDoc,
  updateDoc,
  DocumentReference,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { UserProfile } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { User } from "@/app/(protected)/users/data/schema";

const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore: (user) => user,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options) as UserProfile;
    return {
      ...data,
      uid: snapshot.id,
    };
  },
};

class FirebaseUsers {
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
      this.collectionName = "users";
    } catch (error) {
      console.error("[FirebaseUsers][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefUser(): DocumentReference<UserProfile> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseProducts][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    // Add more detailed path debugging
    const path = `${this.collectionName}/${userId}`;

    const userRef = doc(this.db, path).withConverter(userConverter);

    return userRef;
  }

  /**
   * Get the current user profile from Firestore
   * @returns Promise with user profile data
   */
  async getCurrentUserProfile() {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const userId = this.auth.currentUser.uid;
      const userRef = doc(
        this.db,
        `${this.collectionName}/${userId}`
      ).withConverter(userConverter);

      console.log(
        `[FirebaseUsers][getCurrentUserProfile] Fetching user profile for ID: ${userId}`
      );

      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log(
          `[FirebaseUsers][getCurrentUserProfile] User profile not found for ID: ${userId}`
        );
        return {
          success: false,
          error: "User profile not found",
        };
      }

      return {
        success: true,
        data: userDoc.data(),
      };
    } catch (error) {
      console.error(
        `[FirebaseUsers][getCurrentUserProfile] Error fetching user profile:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getCurrentUserRef() {
    try {
      if (!this.auth.currentUser) {
        return null;
      }

      const userId = this.auth.currentUser.uid;
      const userRef = doc(
        this.db,
        `${this.collectionName}/${userId}`
      ).withConverter(userConverter);

      return userRef;
    } catch (error) {
      console.error(
        `[FirebaseUsers][getCurrentUserRef] Error fetching user reference:`,
        error
      );
      return null;
    }
  }

  /**
   * Update the current user profile
   * @param profileData Partial user profile data to update
   * @returns Promise with success status and updated profile data
   */
  async updateUserProfile(profileData: Partial<UserProfile>) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const userId = this.auth.currentUser.uid;
      const userRef = doc(
        this.db,
        `${this.collectionName}/${userId}`
      ).withConverter(userConverter);

      // Check if profile exists first
      const userDoc = await getDoc(userRef);

      console.log(
        `[FirebaseUsers][updateUserProfile] Updating user profile for ID: ${userId}`
      );

      const updatedData = {
        ...profileData,
        updatedAt: getCurrentUnixTimestamp(),
      };

      if (!userDoc.exists()) {
        // Create the profile if it doesn't exist
        await setDoc(userRef, {
          ...updatedData,
          uid: userId,
          createdAt: getCurrentUnixTimestamp(),
        });
      } else {
        // Update existing profile
        await updateDoc(userRef, updatedData);
      }

      // Get the updated profile
      const updatedDoc = await getDoc(userRef);

      return {
        success: true,
        data: updatedDoc.data(),
      };
    } catch (error) {
      console.error(
        `[FirebaseUsers][updateUserProfile] Error updating user profile:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export as a singleton
export const firebaseUsers = new FirebaseUsers();
export default FirebaseUsers;
