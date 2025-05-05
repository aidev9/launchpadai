import { z } from "zod";

// START: QUESTIONS
// TODO: Clean up the question schema
export interface Question {
  id: string;
  question: string;
  answer: string | null;
  tags?: string[];
  phase?: string;
  order?: number;
  createdAt?: string;
  last_modified?: string;
}
// Schema for questions within a product
export const productQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  tags: z.array(z.string()),
  last_modified: z.coerce.date(),
  createdAt: z.coerce.date(),
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: number | string;
  updatedAt?: number | string;
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
});

export type TechStackAssetInput = z.infer<typeof techStackAssetInputSchema>;
// END: TECH STACKS
