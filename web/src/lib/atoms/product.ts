import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  Product as SchemaProduct,
  Phases,
  TechStack,
  Collection,
  Document,
} from "@/lib/firebase/schema";

// Re-export the Product type from schema.ts
export type Product = SchemaProduct;

// Re-export Collection and Document types from schema
export type { Collection, Document } from "@/lib/firebase/schema";

// Business stack types
export interface BusinessStack {
  id?: string;
  productId?: string;
  userId?: string;
  marketSize: string;
  revenueModel: string;
  distributionChannels: string[];
  customerAcquisition: string;
  valueProposition: string;
  costStructure?: string;
  partnerships?: string[];
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Technical stack types
export interface TechnicalStack {
  id?: string;
  productId?: string;
  platform: string[];
  frontendTechnologies: string[];
  backendTechnologies: string[];
  databases: string[];
  apis: string[];
  deploymentStrategy?: string;
  securityMeasures?: string[];
  scalabilityPlans?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Rules types
export interface Rules {
  id?: string;
  productId?: string;
  designPrinciples: string[];
  codingStandards: string[];
  brandGuidelines: string[];
  accessibilityRequirements: string[];
  performanceRequirements?: string[];
  complianceRules?: string[];
  qualityAssuranceProcesses?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Feature types - matching main schema for consistency
export interface Feature {
  id?: string;
  name: string;
  description: string;
  status: "Active" | "Inactive" | "Under Development" | "Draft";
  tags: string[];
  productId: string;
  prdContent?: string;
  priority?: "high" | "medium" | "low"; // Additional field for wizard
  userStories?: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Note types
export interface Note {
  id?: string;
  productId?: string;
  title: string;
  content: string;
  category:
    | "general"
    | "technical"
    | "business"
    | "user-feedback"
    | "improvement"
    | "other";
  importance?: "high" | "medium" | "low";
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Atoms for product and its related entities
export const productAtom = atomWithStorage<Product | null>("product", null);
export const businessStackAtom = atomWithStorage<BusinessStack | null>(
  "businessStack",
  null
);
export const technicalStackAtom = atomWithStorage<TechnicalStack | null>(
  "technicalStack",
  null
);
export const rulesAtom = atomWithStorage<Rules | null>("rules", null);
export const featuresAtom = atomWithStorage<Feature[]>("features", []);
export const collectionsAtom = atomWithStorage<Collection[]>("collections", []);
export const notesAtom = atomWithStorage<Note[]>("notes", []);

// Selected entity atoms for wizard flow
export const selectedProductAtom = atom<Product | null>(null);
export const selectedBusinessStackAtom = atom<BusinessStack | null>(null);
export const selectedTechStackAtom = atom<TechStack | null>(null);
export const selectedRulesAtom = atom<Rules | null>(null);

// Active entities atoms
export const activeFeatureAtom = atom<Feature | null>(null);
export const activeCollectionAtom = atom<Collection | null>(null);
export const activeNoteAtom = atom<Note | null>(null);
