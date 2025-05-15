import { z } from "zod";

// START: PRODUCT
export type Product = {
  id: string;
  name: string;
  description?: string;
  stage: string;
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
  subscription?: "free" | "explorer" | "builder" | "enterprise";
  xp?: number;
  level?: number;
  hasAnsweredTimelineQuestion?: boolean;
  hasCompletedOnboarding?: boolean;
  completedQuests?: string[];
  bio?: string;
  urls?: { value: string }[];
}

// END: USER PROFILE

// START: SUBSCRIPTION
// Define subscription interface
export interface Subscription {
  planType: string;
  billingCycle: "monthly" | "annual";
  price: number;
  status: "active" | "inactive";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  createdAt: number;
  paymentIntentId: string;
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
export type PlanType = "Free" | "Explorer" | "Builder" | "Accelerator";
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
  planType: PlanType;
  billingCycle: BillingCycle;
  price: number;
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
// TODO: Clean up the question schema

const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  phases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  updatedAt: z.number().optional(),
  createdAt: z.number().optional(),
  order: z.number().optional(),
});

// export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);

export interface Question {
  id: string;
  question: string;
  answer: string | null;
  tags?: string[];
  phases?: string[];
  order?: number;
  createdAt?: number;
  updatedAt?: number;
}
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
  id?: string;
  userId?: string;
  appType: string;
  frontEndStack: string;
  backendStack: string;
  database: string;
  aiAgentStack: string[];
  integrations: string[];
  deploymentStack: string;
  name: string;
  description: string;
  tags: string[];
  phase: string[];
  prompt?: string;
  documentationLinks?: string[];
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Zod schema for tech stack validation
 */
export const techStackInputSchema = z.object({
  appType: z.string().default(""),
  frontEndStack: z.string().default(""),
  backendStack: z.string().default(""),
  database: z.string().default(""),
  // Make these fields optional
  aiAgentStack: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  deploymentStack: z.string().default(""),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()).default([]),
  phase: z.array(z.string()).default([]),
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

// export interface FirestoreAsset {
//   id: string;
//   phase: string;
//   document: string;
//   content?: string;
//   title?: string;
//   systemPrompt?: string;
//   order?: number;
//   createdAt?: number;
//   updatedAt?: number;
// }

export interface Asset {
  id: string;
  phase:
    | "Discover"
    | "Validate"
    | "Design"
    | "Build"
    | "Secure"
    | "Launch"
    | "Grow";
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
  phase: Asset["phase"];
  tags: string[];
  order: number;
  content?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProductNote {
  id: string;
  note_body: string;
  tags?: string[];
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
  tags: string[];
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
    // console.error("getPromptCreditsByPlan:::planType:::", planType);
    return { daily: 10, monthly: 0 };
  }

  switch (planType.toLowerCase()) {
    case "free":
      return { daily: 10, monthly: 0 };
    case "explorer":
      return { daily: 0, monthly: 300 };
    case "builder":
      return { daily: 0, monthly: 600 };
    case "enterprise":
      return { daily: 0, monthly: 900 };
    default:
      return { daily: 10, monthly: 0 };
  }
}
// END: PROMPT CREDITS
