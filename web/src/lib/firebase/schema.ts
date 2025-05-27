import { z } from "zod";

// Define common enums
export enum Phases {
  ALL = "All",
  DISCOVER = "Discover",
  VALIDATE = "Validate",
  DESIGN = "Design",
  BUILD = "Build",
  SECURE = "Secure",
  LAUNCH = "Launch",
  GROW = "Grow",
}

// START: PRODUCT
export type Product = {
  id: string;
  name: string;
  description?: string;
  phases: Phases[];
  problem?: string;
  team?: string;
  website?: string;
  country?: string;
  template_id?: string;
  template_type?: string;
  createdAt?: number;
  updatedAt?: number;
};

// END: PRODUCT

// START: USER PROFILE
export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  isEmailVerified?: boolean;
  createdAt?: number;
  userType?: "user" | "admin" | "superadmin";
  subscription?: "free" | "explorer" | "builder" | "accelerator";
  xp?: number;
  level?: number;
  hasAnsweredTimelineQuestion?: boolean;
  hasCompletedOnboarding?: boolean;
  lastWizardStep?: [number, number];
  completedQuests?: string[];
  bio?: string;
  urls?: { value: string }[];
}

// END: USER PROFILE

// START: SUBSCRIPTION
// Define subscription interface
export interface Subscription {
  billingCycle: "monthly" | "annual";
  price: number;
  status: "active" | "inactive";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: number;
  paymentIntentId: string;
  planType: "free" | "explorer" | "builder" | "accelerator";
}

// Schema for user subscription data
export const userSubscriptionSchema = z.object({
  userId: z.string(),
  planType: z.string(),
  billingCycle: z.enum(["monthly", "annual"]),
  price: z.number(),
  paymentIntentId: z.string(),
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string(),
});

// Plan types
export type PlanType = "free" | "explorer" | "builder" | "accelerator";
export type BillingCycle = "monthly" | "annual";

// Define plan types and pricing interface
export interface PlanOption {
  title: string;
  description: string;
  monthly: {
    price: number;
    description: string;
    priceId: string;
  };
  annual: {
    price: number;
    description: string;
    priceId: string;
  };
  features: string[];
}

// Interface for selected subscription plan
export interface SubscriptionPlan {
  planType: string;
  billingCycle: BillingCycle;
  price: number;
  active: boolean;
}

// Interface for pricing plan display data
export interface PricingPlan {
  title: string;
  price: number;
  description: string;
  features: { text: string }[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  isPopular?: boolean;
}

// Helper function to calculate the annual price with 20% discount
export const calculateAnnualPrice = (monthlyPrice: number): number => {
  if (monthlyPrice === 0) return 0;
  const annual = Math.round(monthlyPrice * 12 * 0.8);
  return annual;
};

// END: SUBSCRIPTION

// START: QUESTIONS
export const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  phases: z.array(z.nativeEnum(Phases)).default([]),
  tags: z.array(z.string()).default([]),
  productId: z.string().optional(),
  userId: z.string(),
  updatedAt: z.number().optional(),
  createdAt: z.number().optional(),
  order: z.number().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);

// Schema for question input (for creating/updating)
export const questionInputSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().nullable().optional(),
  phases: z.array(z.nativeEnum(Phases)).default([]),
  tags: z.array(z.string()).default([]),
  productId: z.string().optional(),
});

export type QuestionInput = z.infer<typeof questionInputSchema>;

// Schema for questions within a product
export const productQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  tags: z.array(z.string()),
  updatedAt: z.number(),
  createdAt: z.number(),
  order: z.number().optional(),
});

export type ProductQuestion = z.infer<typeof productQuestionSchema>;

// Schema for product question input (for creating/updating)
export const productQuestionInputSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().nullable().optional(),
  tags: z.array(z.string()),
});

export type ProductQuestionInput = z.infer<typeof productQuestionInputSchema>;

// List of product questions
export const productQuestionListSchema = z.array(productQuestionSchema);
// END: QUESTIONS

// START: COURSES
// Interface for Course data
export interface Course {
  id: string;
  title: string;
  summary: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  imageUrl?: string; // Signed URL to the image in Firebase Storage
  filePath?: string; // Path to the image in Firebase Storage
  url: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Schema for course validation
export const courseInputSchema = z.object({
  title: z.string().min(2).max(200),
  summary: z.string().min(2).max(500),
  description: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  imageUrl: z.string().optional(),
  filePath: z.string().optional(),
  url: z.string(),
  tags: z.array(z.string()),
});

export type CourseInput = z.infer<typeof courseInputSchema>;
// END: COURSES

// START: MODULES
// Interface for Module data
export interface Module {
  id: string;
  title: string;
  body: string; // Rich text
  imageUrl?: string;
  notifyStudents: boolean;
  filePath?: string; // Path to the image in Firebase Storage
  attachments: string[]; // URLs of attachments
  tags: string[];
  xpAwards: number;
  createdAt?: number;
  updatedAt?: number;
}

// Schema for module validation
export const moduleInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  body: z.string(),
  imageUrl: z.string().optional(),
  filePath: z.string().optional(),
  attachments: z.array(z.string()).default([]).optional(),
  tags: z.array(z.string()).default([]).optional(),
  xpAwards: z.number().min(0).max(500),
  notifyStudents: z.boolean().default(false).optional(),
});

export type ModuleInput = z.infer<typeof moduleInputSchema>;
// END: MODULES

// START: PROMPTS
export interface Prompt {
  id?: string;
  title: string;
  body: string;
  phaseTags: string[];
  productTags: string[];
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Zod schema for prompt validation
 */
export const promptInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  body: z.string().min(1, "Body is required"),
  phaseTags: z.array(z.string()).min(1, "Select at least one phase tag"),
  productTags: z.array(z.string()),
  tags: z.array(z.string()),
});

export type PromptInput = z.infer<typeof promptInputSchema>;

export type PhaseTag =
  | "All"
  | "Discover"
  | "Validate"
  | "Design"
  | "Build"
  | "Secure"
  | "Launch"
  | "Grow";

// END: PROMPTS

// START: MODELS

export const modelCategories = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Groq",
] as const;

export type ModelType = (typeof modelCategories)[number];

export interface Model<Type = string> {
  id: string;
  name: string;
  description: string;
  provider?: string;
  strengths?: string;
  type?: Type;
  value?: string;
  label?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  active?: boolean;
}
// END: MODELS

// START: TECH STACKS
export interface TechStack {
  id: string;
  userId: string;
  productId: string;
  appType: string;
  frontEndStack: string;
  backEndStack: string;
  databaseStack: string;
  aiAgentStack: string[];
  integrations: string[];
  deploymentStack: string;
  name: string;
  description: string;
  tags: string[];
  phases: Phases[];
  prompt?: string;
  documentationLinks: string[];
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Zod schema for tech stack validation
 */
export const techStackInputSchema = z.object({
  userId: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  appType: z.string().default(""),
  frontEndStack: z.string().default(""),
  backEndStack: z.string().default(""),
  databaseStack: z.string().default(""),
  // Make these fields optional
  aiAgentStack: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  deploymentStack: z.string().default(""),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()).default([]),
  phases: z.array(z.string()).default([]),
  prompt: z.string().optional(),
  documentationLinks: z.array(z.string()).default([]),
});

export type TechStackInput = z.infer<typeof techStackInputSchema>;

// Tech Stack Asset types
export interface TechStackAsset {
  id?: string;
  title: string;
  body: string;
  tags: string[];
  assetType: "PRD" | "Architecture" | "Tasks" | "Rules" | "Prompt" | "Custom";
  techStackId: string;
  createdAt?: number;
  updatedAt?: number;
  isGenerating?: boolean;
  recentlyCompleted?: boolean;
  completedAt?: number;
  needsGeneration?: boolean;
}

export const techStackAssetInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  tags: z.array(z.string()),
  assetType: z.enum([
    "PRD",
    "Architecture",
    "Tasks",
    "Rules",
    "Prompt",
    "Custom",
  ]),
  techStackId: z.string(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  isGenerating: z.boolean().default(false).optional(),
  recentlyCompleted: z.boolean().default(false).optional(),
  completedAt: z.number().optional(),
  needsGeneration: z.boolean().default(false).optional(),
});

export type TechStackAssetInput = z.infer<typeof techStackAssetInputSchema>;
// END: TECH STACKS

export interface Asset {
  id: string;
  phases: Phases[];
  document: string;
  systemPrompt: string;
  order: number;
}

// Interface for an asset in Firestore
export interface FirestoreAsset {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  phases: Phases[];
  tags: string[];
  order: number;
  content?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Type definition for AI model settings
export interface AIModelSettings {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface Note {
  id: string;
  note_body: string;
  phases: Phases[];
  tags: string[];
  productId: string;
  createdAt: number;
  updatedAt: number;
}

// START: FEEDBACK
// Interface for Feedback data
export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  type: "bug" | "feature" | "comment";
  subject: string;
  body: string;
  status: "new" | "in-progress" | "resolved";
  createdAt: number;
  updatedAt: number;
  response?: string;
  responseAt?: number;
}

// Schema for feedback validation
export const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["bug", "feature", "comment"], {
    required_error: "Please select a feedback type",
  }),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
// END: FEEDBACK

// START: FEATURES
export interface Feature {
  id?: string;
  name: string;
  description: string;
  status: "Active" | "Inactive" | "Under Development" | "Draft";
  tags: string[];
  productId: string;
  prdContent?: string;
  priority?: "high" | "medium" | "low"; // Priority level for feature
  userStories?: string[]; // User stories associated with the feature
  acceptanceCriteria?: string[]; // Acceptance criteria for the feature
  dependencies?: string[]; // Dependencies on other features or components
  createdAt?: number;
  updatedAt?: number;
}

export const featureInputSchema = z.object({
  name: z.string().min(1, "Feature name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Active", "Inactive", "Under Development", "Draft"]),
  tags: z.array(z.string()).default([]),
  productId: z.string().min(1, "Product ID is required"),
  prdContent: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  userStories: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export type FeatureInput = z.infer<typeof featureInputSchema>;
// END: FEATURES

// START: PROMPT CREDITS
export interface PromptCredit {
  id?: string;
  userId: string;
  dailyCredits: number; // Daily free credits (for Free plan)
  monthlyCredits: number; // Monthly allocated credits (for paid plans)
  remainingCredits: number; // Current balance
  createdAt?: number;
  updatedAt?: number;
  lastRefillDate?: number; // Date of last refill
  totalUsedCredits?: number; // Total credits used over time
}

export interface PromptCreditPack {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  priceId: string;
}

export const promptCreditSchema = z.object({
  userId: z.string(),
  dailyCredits: z.number().default(0),
  monthlyCredits: z.number().default(0),
  remainingCredits: z.number().default(0),
  lastRefillDate: z.number().optional(),
  totalUsedCredits: z.number().default(0),
});

export type PromptCreditInput = z.infer<typeof promptCreditSchema>;

// Default prompt packs available for purchase
export const defaultPromptPacks: PromptCreditPack[] = [
  {
    id: "pack_300",
    name: "300 Prompt Pack",
    description: "300 additional prompts",
    credits: 300,
    price: 19,
    priceId: process.env.STRIPE_PROMPT_PACK_300_ID || "price_prompt_pack_300",
  },
  {
    id: "pack_600",
    name: "600 Prompt Pack",
    description: "600 additional prompts",
    credits: 600,
    price: 29,
    priceId: process.env.STRIPE_PROMPT_PACK_600_ID || "price_prompt_pack_600",
  },
  {
    id: "pack_900",
    name: "900 Prompt Pack",
    description: "900 additional prompts",
    credits: 900,
    price: 39,
    priceId: process.env.STRIPE_PROMPT_PACK_900_ID || "price_prompt_pack_900",
  },
];

// Function to get the prompt credit allocation based on plan
export function getPromptCreditsByPlan(planType: string): {
  daily: number;
  monthly: number;
} {
  // Null and undefined check
  if (!planType) {
    return { daily: 10, monthly: 0 };
  }

  switch (planType.toLowerCase()) {
    case "free":
      return { daily: 10, monthly: 0 };
    case "explorer":
      return { daily: 0, monthly: 300 };
    case "builder":
      return { daily: 0, monthly: 600 };
    case "accelerator":
      return { daily: 0, monthly: 900 };
    default:
      return { daily: 10, monthly: 0 };
  }
}
// END: PROMPT CREDITS

// START: COLLECTIONS
// Collection status type
export type CollectionStatus =
  | "uploading"
  | "uploaded"
  | "indexing"
  | "indexed"
  | "reindexing";

// Collection schema
export interface Collection {
  id: string;
  productId: string;
  userId: string;
  title: string;
  description: string;
  phaseTags: string[]; // Array of phase tags
  tags: string[]; // Array of general tags
  status: CollectionStatus; // Status of the collection
  createdAt: number;
  updatedAt: number;
}

// Collection input schema (for validation)
export const collectionInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string(),
  phaseTags: z.array(z.string()),
  tags: z.array(z.string()),
  status: z
    .enum(["uploading", "uploaded", "indexing", "indexed", "reindexing"])
    .default("uploaded"),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
// END: COLLECTIONS

// START: DOCUMENTS
// Document status type
export type DocumentStatus =
  | "uploading"
  | "uploaded"
  | "indexing"
  | "indexed"
  | "reindexing";

// Document schema
export interface Document {
  id: string;
  collectionId: string;
  productId: string;
  userId: string;
  title: string;
  description: string;
  url: string; // Signed URL to the document in Firebase Storage
  filePath: string; // Path to the document in Firebase Storage
  tags: string[]; // Array of tags
  status: DocumentStatus; // Status of the document
  chunkSize: number; // Size of chunks for document processing
  overlap: number; // Overlap between chunks for document processing
  createdAt: number;
  updatedAt: number;
}

// Document input schema (for validation)
export const documentInputSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string(),
  url: z.string().optional(),
  filePath: z.string().optional(),
  tags: z.array(z.string()),
  chunkSize: z.number().default(1000), // Default chunk size of 1000
  overlap: z.number().default(200), // Default overlap of 200
  status: z
    .enum(["uploading", "uploaded", "indexing", "indexed", "reindexing"])
    .default("uploading"),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;
// END: DOCUMENTS

// START: MCP ENDPOINTS
export * from "./schema/mcp-endpoints";
// END: MCP ENDPOINTS

// START: AGENTS
// Agent status type
export type AgentStatus = "enabled" | "disabled" | "configuring";

// Agent schema
export interface Agent {
  id: string;
  userId: string;
  productId: string; // Required product ID
  name: string;
  description: string;
  systemPrompt?: string; // System prompt for the agent
  phases: Phases[];
  tags: string[];
  collections: string[]; // IDs of collections used as knowledge base
  tools: string[]; // IDs of enabled tools
  mcpEndpoints: string[]; // IDs of MCP endpoints
  a2aEndpoints: string[]; // IDs of Agent2Agent endpoints
  configuration: {
    url: string;
    apiKey: string;
    authType?: "bearer" | "apikey" | "none"; // Authentication method
    responseType?: "streaming" | "single"; // Response format preference
    rateLimitPerMinute: number;
    allowedIps: string[];
    isEnabled: boolean;
    a2aOAuth?: {
      clientId: string;
      clientSecret: string;
    };
  };
  createdAt?: number;
  updatedAt?: number;
}

// Agent input schema (for validation)
export const agentInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string(),
  systemPrompt: z.string().optional(),
  phases: z.array(z.nativeEnum(Phases)).default([]),
  tags: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  mcpEndpoints: z.array(z.string()).default([]),
  a2aEndpoints: z.array(z.string()).default([]),
  configuration: z.object({
    url: z.string().optional(),
    apiKey: z.string().optional(),
    authType: z.enum(["bearer", "apikey", "none"]).optional(),
    responseType: z.enum(["streaming", "single"]).optional(),
    rateLimitPerMinute: z.number().min(1).max(1000).default(60),
    allowedIps: z.array(z.string()).default([]),
    isEnabled: z.boolean().default(true),
    a2aOAuth: z
      .object({
        clientId: z.string(),
        clientSecret: z.string(),
      })
      .optional(),
  }),
});

export type AgentInput = z.infer<typeof agentInputSchema>;

// Tool schema for agent tools
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiKeyRequired: boolean;
  isEnabled: boolean;
  apiKey?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const agentToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  provider: z.string(),
  apiKeyRequired: z.boolean().default(true),
  isEnabled: z.boolean().default(false),
  apiKey: z.string().optional(),
});

export type AgentToolInput = z.infer<typeof agentToolSchema>;

// START: ERROR LOGGING
export interface ErrorLog {
  id: string;
  userId?: string;
  url: string;
  userAgent: string;
  errorCode: string;
  errorMessage: string;
  errorStack?: string;
  errorType: "javascript" | "firebase" | "network" | "validation" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  component?: string; // Component where error occurred
  action?: string; // Action being performed when error occurred
  metadata?: Record<string, any>; // Additional context data
  createdAt: number;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

// Schema for error input validation
export const errorLogInputSchema = z.object({
  userId: z.string().optional(),
  url: z.string(),
  userAgent: z.string(),
  errorCode: z.string(),
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  errorType: z
    .enum(["javascript", "firebase", "network", "validation", "unknown"])
    .default("unknown"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  component: z.string().optional(),
  action: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type ErrorLogInput = z.infer<typeof errorLogInputSchema>;
// END: ERROR LOGGING
// END: AGENTS
