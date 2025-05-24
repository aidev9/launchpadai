import { z } from "zod";

/**
 * Feature interface representing a product feature
 */
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

/**
 * Zod schema for feature validation
 */
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
