import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Type for the product
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
  createdAt?: string;
  last_modified?: string;
};

// Store selected product ID in localStorage
export const selectedProductIdAtom = atomWithStorage<string | null>(
  "selectedProductId",
  null
);

// Store the actual product data
export const selectedProductAtom = atom<Product | null>(null);

// Store all products
export const productsAtom = atom<Product[]>([]);

// Store product count
// export const productCountAtom = atom<number | null>(null);

// Create a derived atom for product count that automatically updates
// whenever the products array changes
export const productCountAtom = atom((get) => get(productsAtom).length);

// Filtering state for products list view
export const productFilterAtom = atom<string>("");

// Flag to track if product count has been loaded
export const productCountLoadedAtom = atom<boolean>(false);
