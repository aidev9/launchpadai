import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAtom } from "jotai";
import {
  productsAtom,
  selectedProductIdAtom,
  selectedProductAtom,
  Product,
} from "@/lib/store/product-store";
import { getAllProducts, getProduct } from "@/lib/firebase/products";

interface ApiResponse<T> {
  success: boolean;
  product?: T;
  products?: T[];
  error?: string;
}

// Cache configuration
const CACHE_TTL = 60000; // 1 minute cache validity

export function useProducts() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache and fetch state management with refs to persist across renders
  const cacheRef = useRef<{
    products: {
      data: Product[];
      timestamp: number;
    } | null;
    productMap: Map<string, { data: Product; timestamp: number }>;
    nonExistentIds: Set<string>;
  }>({
    products: null,
    productMap: new Map(),
    nonExistentIds: new Set(),
  });

  const fetchingRef = useRef<{ products: boolean; productId: string | null }>({
    products: false,
    productId: null,
  });

  const initialFetchAttemptedRef = useRef<boolean>(false);

  // Jotai state
  const [products, setProducts] = useAtom(productsAtom);
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);

  // Fetch all products - with caching and throttling
  const fetchProducts = useCallback(
    async (force = false): Promise<ApiResponse<Product>> => {
      // Skip if already fetching
      if (fetchingRef.current.products && !force) {
        return { success: true, products: products };
      }

      // Check cache if not forcing refresh
      const now = Date.now();
      if (
        !force &&
        cacheRef.current.products &&
        now - cacheRef.current.products.timestamp < CACHE_TTL
      ) {
        return { success: true, products: cacheRef.current.products.data };
      }

      // Proceed with network fetch
      setIsLoading(true);
      fetchingRef.current.products = true;
      setError(null);

      try {
        const result = await getAllProducts();
        initialFetchAttemptedRef.current = true;

        if (result.success && result.products) {
          const productsList = result.products as Product[];

          // Update cache
          cacheRef.current.products = {
            data: productsList,
            timestamp: now,
          };

          // Also update individual product cache entries
          productsList.forEach((product) => {
            cacheRef.current.productMap.set(product.id, {
              data: product,
              timestamp: now,
            });
          });

          setProducts(productsList);

          return {
            success: true,
            products: productsList,
          };
        } else {
          const errorMsg = result.error || "Failed to fetch products";
          console.error(`[useProducts] fetchProducts failed: ${errorMsg}`);
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch products";
        setError(errorMessage);
        console.error("[useProducts] Error fetching products:", error);

        // Handle authentication errors specifically
        if (
          errorMessage.includes("not authenticated") ||
          errorMessage.includes("Authentication failed")
        ) {
          console.log(
            "[useProducts] Authentication error detected, redirecting to sign in"
          );
          // If we're in a browser environment, redirect to sign in
          if (typeof window !== "undefined") {
            window.location.href = "/auth/signin";
          }
        }

        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
        fetchingRef.current.products = false;
      }
    },
    // Remove products from dependency array to prevent infinite loops
    [setProducts]
  );

  // Fetch a single product by ID
  const fetchProductById = useCallback(
    async (productId: string): Promise<ApiResponse<Product>> => {
      // Skip if known not to exist
      if (cacheRef.current.nonExistentIds.has(productId)) {
        return {
          success: false,
          error: `Product with ID ${productId} does not exist`,
        };
      }

      // Check cache first
      const cachedProduct = cacheRef.current.productMap.get(productId);
      if (cachedProduct && Date.now() - cachedProduct.timestamp < CACHE_TTL) {
        return {
          success: true,
          product: cachedProduct.data,
        };
      }

      // Check if this product ID is already being fetched
      if (fetchingRef.current.productId === productId) {
        // If found in products array while waiting, return it
        const existingProduct = products.find((p) => p.id === productId);
        if (existingProduct) {
          return { success: true, product: existingProduct };
        }

        // Otherwise wait a bit and return what we have
        await new Promise((resolve) => setTimeout(resolve, 100));
        return selectedProduct
          ? { success: true, product: selectedProduct }
          : { success: false, error: "Product not found" };
      }

      // Fetch from network
      setIsLoading(true);
      fetchingRef.current.productId = productId;
      setError(null);

      try {
        const result = await getProduct(productId);

        if (result.success && result.product) {
          const product = result.product as Product;

          // Cache the result
          cacheRef.current.productMap.set(productId, {
            data: product,
            timestamp: Date.now(),
          });

          return { success: true, product };
        } else {
          // Mark as non-existent to avoid future fetches
          cacheRef.current.nonExistentIds.add(productId);

          const errorMsg =
            result.error || `Failed to fetch product with ID ${productId}`;
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        // Mark as non-existent on errors too
        cacheRef.current.nonExistentIds.add(productId);

        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to fetch product with ID ${productId}`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
        fetchingRef.current.productId = null;
      }
    },
    // Keep products in this dependency array since we're reading from it directly
    [products, selectedProduct]
  );

  // Helper to clear product selection
  const clearProductSelection = useCallback(() => {
    localStorage.removeItem("selectedProductId");
    setSelectedProductId(null);
    setSelectedProduct(null);
  }, [setSelectedProductId, setSelectedProduct]);

  // Consolidated method for selecting a product - updates both ID and data atoms
  const selectProduct = useCallback(
    async (productId: string): Promise<ApiResponse<Product>> => {
      // Skip if already selected
      if (
        selectedProductId === productId &&
        selectedProduct?.id === productId
      ) {
        return { success: true, product: selectedProduct };
      }

      // Skip if we know this ID doesn't exist
      if (cacheRef.current.nonExistentIds.has(productId)) {
        clearProductSelection();
        return {
          success: false,
          error: `Product with ID ${productId} does not exist`,
        };
      }

      // Optimistically update the selected ID immediately for better UX
      setSelectedProductId(productId);

      // First check if we have the product in any cache
      // Check product map cache
      const cachedProduct = cacheRef.current.productMap.get(productId);
      if (cachedProduct && Date.now() - cachedProduct.timestamp < CACHE_TTL) {
        setSelectedProduct(cachedProduct.data);
        return { success: true, product: cachedProduct.data };
      }

      // Check products array (in-memory state)
      const existingProduct = products.find((p) => p.id === productId);
      if (existingProduct) {
        // Update the cached product map
        cacheRef.current.productMap.set(productId, {
          data: existingProduct,
          timestamp: Date.now(),
        });

        setSelectedProduct(existingProduct);
        return { success: true, product: existingProduct };
      }

      // If not found in any cache, fetch from API
      try {
        const result = await fetchProductById(productId);

        if (result.success && result.product) {
          setSelectedProduct(result.product);
          return result;
        } else {
          // Clear selection if product doesn't exist
          clearProductSelection();
          return result;
        }
      } catch (error) {
        clearProductSelection();
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      selectedProductId,
      selectedProduct,
      products,
      setSelectedProductId,
      setSelectedProduct,
      fetchProductById,
      clearProductSelection,
    ]
  );

  // Initialize products on first mount
  useEffect(() => {
    // Only fetch once on mount, using the ref to track this
    if (!initialFetchAttemptedRef.current && !fetchingRef.current.products) {
      initialFetchAttemptedRef.current = true;
      fetchProducts().catch((err) => {
        console.error("[useProducts] Error during initial fetch:", err);
      });
    }
    // Add fetchProducts to dependencies, but wrap the effect in useRef to prevent re-runs
  }, [fetchProducts]);

  // Handle loading selected product when ID changes - fix dependency array
  useEffect(() => {
    // Skip if no selected ID or product already matches ID
    if (
      !selectedProductId ||
      selectedProduct?.id === selectedProductId ||
      cacheRef.current.nonExistentIds.has(selectedProductId)
    ) {
      return;
    }

    // Track if component is mounted
    let isMounted = true;

    // Use a local copy of the current ID to avoid stale closure issues
    const currentId = selectedProductId;

    // Wrap in immediate async function to avoid useEffect async warnings
    (async () => {
      try {
        if (!isMounted) return;
        await selectProduct(currentId);
      } catch (err) {
        console.error("[useProducts] Error loading selected product:", err);
        if (isMounted) {
          clearProductSelection();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedProductId, selectedProduct?.id]); // Reduce dependencies to just what's needed

  // Compute derived state
  const hasProducts = products.length > 0;

  // Return memoized API to prevent unnecessary renders
  return useMemo(
    () => ({
      // Data state
      products,
      selectedProduct,
      selectedProductId,

      // UI state
      isLoading,
      hasProducts,
      error,

      // Methods
      fetchProducts,
      selectProduct,
      clearProductSelection,

      // For compatibility with existing code
      fetchProductById,
      setSelectedProductId: selectProduct,
      setSelectedProduct,
    }),
    [
      products,
      selectedProduct,
      selectedProductId,
      isLoading,
      hasProducts,
      error,
      fetchProducts,
      selectProduct,
      clearProductSelection,
      fetchProductById,
      setSelectedProduct,
    ]
  );
}
