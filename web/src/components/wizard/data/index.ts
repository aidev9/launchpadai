/**
 * Centralized export of all playground categories
 * This file aggregates all individual category files for easy importing
 */

import { PlaygroundCategory } from "../playground-types";

// Import all category data
import { marketingCategory } from "./marketing";
import { engineeringCategory } from "./engineering";
import { developmentCategory } from "./development";
import { vibeCodingCategory } from "./vibe-coding";
import { legalCategory } from "./legal";
import { salesCategory } from "./sales";
import { governmentCategory } from "./government";
import { nonprofitCategory } from "./nonprofit";
import { productCategory } from "./product";
import { startupsCategory } from "./startups";

/**
 * Complete array of all playground categories
 * Enhanced prompts with detailed personas and frameworks
 */
export const PLAYGROUND_CATEGORIES: PlaygroundCategory[] = [
  marketingCategory,
  engineeringCategory,
  developmentCategory,
  vibeCodingCategory,
  legalCategory,
  salesCategory,
  governmentCategory,
  nonprofitCategory,
  productCategory,
  startupsCategory,
];

/**
 * Export individual categories for selective importing
 */
export {
  marketingCategory,
  engineeringCategory,
  developmentCategory,
  vibeCodingCategory,
  legalCategory,
  salesCategory,
  governmentCategory,
  nonprofitCategory,
  productCategory,
  startupsCategory,
};

/**
 * Helper function to get a category by ID
 */
export const getCategoryById = (id: string): PlaygroundCategory | undefined => {
  return PLAYGROUND_CATEGORIES.find((category) => category.id === id);
};

/**
 * Helper function to get a subcategory by category ID and subcategory ID
 */
export const getSubcategoryById = (
  categoryId: string,
  subcategoryId: string
) => {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(
    (subcategory) => subcategory.id === subcategoryId
  );
};

/**
 * Get all category names for quick reference
 */
export const getCategoryNames = (): string[] => {
  return PLAYGROUND_CATEGORIES.map((category) => category.name);
};

/**
 * Get total count of all subcategories across all categories
 */
export const getTotalSubcategoryCount = (): number => {
  return PLAYGROUND_CATEGORIES.reduce(
    (total, category) => total + category.subcategories.length,
    0
  );
};
