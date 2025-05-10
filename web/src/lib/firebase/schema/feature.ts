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
});

export type FeatureInput = z.infer<typeof featureInputSchema>;
