import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Product } from "@/lib/firebase/schema";
import { Table } from "@tanstack/react-table";

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
