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
export {
  createMcpEndpointConfig,
  getMcpEndpointConfig,
  getMcpEndpointConfigsByCollection,
  updateMcpEndpointConfig,
  deleteMcpEndpointConfig,
} from "./FirebaseMcpEndpoints";

// Re-export types if needed
export type { FirebaseOptions } from "firebase/app";
