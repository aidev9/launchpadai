// Import and export the firebase client instances
import { clientApp, clientAuth, clientDb, signOutUser } from "../client";
export { clientApp, clientAuth, clientDb, signOutUser };

// Export Firebase classes
export { firebaseCollections } from "./FirebaseCollections";
export { firebaseDocuments } from "./FirebaseDocuments";
export { firebaseNotes } from "./FirebaseNotes";
export { firebaseProducts } from "./FirebaseProducts";
export { firebaseQA } from "./FirebaseQA";
export { firebaseStacks } from "./FirebaseStacks";
export { firebasePrompts } from "./FirebasePrompts";
export { firebaseRules } from "./FirebaseRules";
export { firebaseMcpEndpoints } from "./FirebaseMcpEndpoints";

// Export wizard-related Firebase classes
export { FirebaseProgress } from "./FirebaseProgress";
export { FirebaseFeatureLocks } from "./FirebaseFeatureLocks";
export { FirebaseRewards } from "./FirebaseRewards";
export { firebaseUsers } from "./FirebaseUsers";

// Re-export types if needed
export type { FirebaseOptions } from "firebase/app";
