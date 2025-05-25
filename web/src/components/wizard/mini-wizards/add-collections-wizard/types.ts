import { Collection, Document } from "@/lib/store/product-store";
import { DocumentStatus } from "@/lib/firebase/schema";

// Type definitions for wizard state
export interface WizardCollection
  extends Omit<
    Collection,
    "id" | "userId" | "status" | "createdAt" | "updatedAt"
  > {
  id?: string;
  status?: DocumentStatus;
  documents: WizardDocument[];
}

export interface WizardDocument
  extends Omit<
    Document,
    "id" | "userId" | "status" | "createdAt" | "updatedAt" | "url" | "filePath"
  > {
  id?: string;
  file?: File;
  status?: DocumentStatus;
  uploadProgress?: number;
}

// Phase tags options
export const phaseTagOptions = [
  "All",
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];
