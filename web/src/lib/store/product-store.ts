import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  Product,
  TechStack,
  Collection,
  Document,
} from "@/lib/firebase/schema";
import { Table } from "@tanstack/react-table";

/**
 * UNIFIED PRODUCT STORE
 *
 * This is the consolidated product store that handles both:
 * 1. Product management state (tables, filtering, CRUD operations)
 * 2. Wizard flow state (current selected entities during wizard process)
 *
 * Previously these were split between /lib/store/product-store.ts and /lib/atoms/product.ts
 * but are now unified for consistency and to avoid duplicate selectedProductAtom definitions.
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

// Re-export types from schema for convenience
export type {
  Product,
  TechStack,
  Collection,
  Document,
} from "@/lib/firebase/schema";

// Business stack types for wizard flow
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

// Technical stack types for wizard flow
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

// Rules types for wizard flow
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

// Feature types for wizard flow
export interface Feature {
  id?: string;
  name: string;
  description: string;
  status: "Active" | "Inactive" | "Under Development" | "Draft";
  tags: string[];
  productId: string;
  prdContent?: string;
  priority?: "high" | "medium" | "low";
  userStories?: string[];
  acceptanceCriteria?: string[];
  dependencies?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Note types for wizard flow
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

// ========================================
// WIZARD FLOW STATE ATOMS
// ========================================

// Core wizard entities with localStorage persistence
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

// Selected entity atoms for wizard flow (in-memory state)
export const selectedBusinessStackAtom = atom<BusinessStack | null>(null);
export const selectedTechStackAtom = atom<TechStack | null>(null);
export const selectedRulesAtom = atom<Rules | null>(null);

// Active entities atoms for wizard flow
export const activeFeatureAtom = atom<Feature | null>(null);
export const activeCollectionAtom = atom<Collection | null>(null);
export const activeNoteAtom = atom<Note | null>(null);

// ========================================
// DERIVED ATOMS FOR WIZARD FLOW
// ========================================

// Derived atom that automatically syncs productAtom to selectedProductAtom
// This ensures that wizard components that use selectedProductAtom get the current product
export const syncSelectedProductAtom = atom(
  (get) => get(selectedProductAtom),
  (get, set, update: Product | null) => {
    set(selectedProductAtom, update);
    // Also update the storage-backed productAtom
    if (update) {
      set(productAtom, update);
    }
  }
);

// Auto-sync atom that keeps selectedProductAtom in sync with productAtom
export const autoSyncProductAtom = atom(
  (get) => {
    const product = get(productAtom);
    const selectedProduct = get(selectedProductAtom);

    // If we have a product in storage but no selected product, sync it
    if (product && !selectedProduct) {
      return product;
    }

    return selectedProduct;
  },
  (get, set, update: Product | null) => {
    set(selectedProductAtom, update);
    if (update) {
      set(productAtom, update);
    }
  }
);

// Initialize selected product with stored product on app start
export const initializeSelectedProductAtom = atom(null, (get, set) => {
  const storedProduct = get(productAtom);
  if (storedProduct && !get(selectedProductAtom)) {
    set(selectedProductAtom, storedProduct);
  }
});

// ========================================
// COMPUTED ATOMS
// ========================================

// Get current product context for variable injection in playground templates
export const productContextAtom = atom((get) => {
  const product = get(autoSyncProductAtom); // Use auto-sync atom instead
  const businessStack = get(businessStackAtom);
  const technicalStack = get(technicalStackAtom);
  const rules = get(rulesAtom);
  const features = get(featuresAtom);
  const collections = get(collectionsAtom);
  const notes = get(notesAtom);

  return {
    productName: product?.name || "",
    productDescription: product?.description || "",
    businessStack: businessStack ? JSON.stringify(businessStack, null, 2) : "",
    techStack: technicalStack ? JSON.stringify(technicalStack, null, 2) : "",
    features: features.map((f) => f.name).join(", "),
    collections: collections.map((c) => c.title).join(", "), // Use 'title' property
    notes: notes.map((n) => n.title).join(", "),
    rules: rules ? JSON.stringify(rules, null, 2) : "",
  };
});

// ========================================
// PRODUCT MANAGEMENT STATE ATOMS
// ========================================

// Store selected product ID in localStorage
export const selectedProductIdAtom = atomWithStorage<string | null>(
  "selectedProductId",
  null
);

// Store the actual product data in localStorage
export const selectedProductAtom = atomWithStorage<Product | null>(
  "selectedProduct",
  null
);

// Store all products
export const productsAtom = atom<Product[]>([]);

// Store product count
// export const productCountAtom = atom<number | null>(null);

// Store product count that automatically updates
// whenever the products array changes
export const productCountAtom = atom((get) => get(productsAtom).length);

// Filtering state for products list view
export const productFilterAtom = atom<string>("");

// Flag to track if product count has been loaded
export const productCountLoadedAtom = atom<boolean>(false);

// View mode (table or card/grid)
export const productViewModeAtom = atomWithStorage<"table" | "grid">(
  "productViewMode",
  "grid"
);

// Row selection state for table view
export const productRowSelectionAtom = atom<Record<string, boolean>>({});

// Table instance reference for products
export const productTableInstanceAtom = atom<Table<Product> | null>(null);

// Table sorting state
export const productSortingAtom = atom<
  {
    id: string;
    desc: boolean;
  }[]
>([]);

// Table column visibility state
export const productColumnVisibilityAtom = atom<{
  [key: string]: boolean;
}>({});

// Table column filters state
export const productColumnFiltersAtom = atom<
  {
    id: string;
    value: any;
  }[]
>([]);

// Phase filter state for products
export const productPhaseFilterAtom = atom<string[]>([]);

// Search query for products
export const productSearchQueryAtom = atom<string>("");

// Highlighted product ID for animation effects
export const highlightedProductIdAtom = atom<string | null>(null);

// Optimistic update atoms
export const addProductAtom = atom(null, (get, set, product: Product) => {
  set(productsAtom, [product, ...get(productsAtom)]);
});

export const updateProductAtom = atom(
  null,
  (get, set, updatedProduct: Product) => {
    set(
      productsAtom,
      get(productsAtom).map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  }
);

export const deleteProductAtom = atom(null, (get, set, product: Product) => {
  set(
    productsAtom,
    get(productsAtom).filter((p) => p.id !== product.id)
  );
});

export const deleteMultipleProductsAtom = atom(
  null,
  (get, set, ids: string[]) => {
    set(
      productsAtom,
      get(productsAtom).filter((product) => !ids.includes(product.id))
    );
  }
);

// Product tags filter atom
export const productTagsFilterAtom = atom<string[]>([]);

// New edited product atom
export const editedProductAtom = atom<Product | null>(null);
