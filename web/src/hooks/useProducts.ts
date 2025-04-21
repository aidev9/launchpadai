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

export function useProducts() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track last fetch time to avoid excessive API calls
  const lastProductsFetchRef = useRef<number>(0);
  const productCacheRef = useRef<Map<string, Product>>(new Map());
  const fetchingRef = useRef<boolean>(false);
  // Track if initial fetch has been attempted regardless of result
  const initialFetchAttemptedRef = useRef<boolean>(false);
  // Keep track of product IDs that don't exist in the database
  const nonExistentProductIdsRef = useRef<Set<string>>(new Set());

  const [products, setProducts] = useAtom(productsAtom);
  const [selectedProductId, setSelectedProductId] = useAtom(
    selectedProductIdAtom
  );
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);

  // Fetch products with throttling and caching
  const fetchProducts = useCallback(
    async (force = false): Promise<ApiResponse<Product>> => {
      // If force is true, we want to bypass throttling and always fetch from the server
      if (force) {
        console.log("[useProducts] Force fetching products from server");

        // But still protect against concurrent fetches
        if (fetchingRef.current) {
          console.log(
            "[useProducts] Waiting for current fetch to complete before force fetching"
          );
          // Wait for any in-progress fetch to complete first
          let waitAttempts = 0;
          while (fetchingRef.current && waitAttempts < 10) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            waitAttempts++;
          }

          if (fetchingRef.current) {
            console.log("[useProducts] Gave up waiting for previous fetch");
            return { success: true, products: products as Product[] };
          }
        }

        // Proceed with forced fetch
        setIsLoading(true);
        fetchingRef.current = true;
        setError(null);

        try {
          const result = await getAllProducts();
          initialFetchAttemptedRef.current = true;

          if (result.success && result.products) {
            const productsList = result.products as Product[];

            // Update cache
            productCacheRef.current.clear(); // Clear existing cache
            productsList.forEach((product) => {
              productCacheRef.current.set(product.id, product);
            });

            // Update last fetch time
            lastProductsFetchRef.current = Date.now();

            setProducts(productsList);
            setHasProducts(productsList.length > 0);
            return {
              success: result.success,
              products: productsList,
              error: result.error,
            };
          } else {
            const errorMsg = result.error || "Failed to fetch products";
            setError(errorMsg);
            return { success: false, error: errorMsg };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch products";
          setError(errorMessage);
          console.error("Failed to fetch products:", error);
          return { success: false, error: errorMessage };
        } finally {
          setIsLoading(false);
          fetchingRef.current = false;
        }
      }

      // Normal non-forced fetch with caching and throttling:

      // Prevent concurrent fetches
      if (fetchingRef.current && !force) {
        console.log("[useProducts] Fetch already in progress, skipping");
        return { success: true, products: products as Product[] };
      }

      // Check if we've recently fetched - throttle to once per minute unless forced
      const now = Date.now();
      const timeSinceLastFetch = now - lastProductsFetchRef.current;

      // If we already have products and aren't forcing a refresh
      // and it's been less than a minute, just use cached data
      if (!force && products.length > 0 && timeSinceLastFetch < 60000) {
        setHasProducts(true);
        return { success: true, products: products as Product[] };
      }

      setIsLoading(true);
      fetchingRef.current = true;
      setError(null);

      try {
        const result = await getAllProducts();
        // Mark that we've attempted a fetch
        initialFetchAttemptedRef.current = true;

        if (result.success && result.products) {
          const productsList = result.products as Product[];

          // Update cache
          productsList.forEach((product) => {
            productCacheRef.current.set(product.id, product);
          });

          // Update last fetch time
          lastProductsFetchRef.current = now;

          setProducts(productsList);
          setHasProducts(productsList.length > 0);
          return {
            success: result.success,
            products: productsList,
            error: result.error,
          };
        } else {
          const errorMsg = result.error || "Failed to fetch products";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch products";
        setError(errorMessage);
        console.error("Failed to fetch products:", error);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    },
    [products.length, setProducts]
  );

  // Optimized product fetch with caching
  const fetchProductById = useCallback(
    async (productId: string): Promise<ApiResponse<Product>> => {
      // Skip fetching if we already know this product doesn't exist
      if (nonExistentProductIdsRef.current.has(productId)) {
        console.log(
          `[useProducts] Product ${productId} is known not to exist, skipping fetch`
        );
        return {
          success: false,
          error: `Product with ID ${productId} does not exist`,
        };
      }

      // Check cache first
      if (productCacheRef.current.has(productId)) {
        const product = productCacheRef.current.get(productId)!;
        console.log(`[useProducts] Cache hit for product ${productId}`);
        return {
          success: true,
          product,
        };
      }

      // If another fetch is already in progress, log it but continue anyway
      // This prevents error on page refresh when multiple components try to load the product
      if (fetchingRef.current) {
        console.log(
          "[useProducts] Another fetch is already in progress, but we'll continue anyway"
        );
      }

      setIsLoading(true);
      fetchingRef.current = true;
      setError(null);

      try {
        const result = await getProduct(productId);
        if (result.success && result.product) {
          // Cache the result
          const product = result.product as Product;
          productCacheRef.current.set(productId, product);
          return { success: true, product };
        } else {
          // Mark this product ID as non-existent to avoid further fetches
          nonExistentProductIdsRef.current.add(productId);

          const errorMsg =
            result.error || `Failed to fetch product with ID ${productId}`;
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        // Mark this product ID as non-existent on errors too
        nonExistentProductIdsRef.current.add(productId);

        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to fetch product with ID ${productId}`;
        setError(errorMessage);
        console.error(`Failed to fetch product with ID ${productId}:`, error);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    },
    []
  );

  // Optimized product selection with caching
  const selectProduct = useCallback(
    async (productId: string): Promise<ApiResponse<Product>> => {
      console.log("[useProduct] selectProduct called with ID:", productId);

      // Skip if already selected
      if (
        selectedProductId === productId &&
        selectedProduct?.id === productId
      ) {
        console.log("[useProduct] Product already selected, skipping");
        return { success: true, product: selectedProduct };
      }

      // Skip if we know this product doesn't exist
      if (nonExistentProductIdsRef.current.has(productId)) {
        console.log(
          `[useProduct] Product ${productId} is known not to exist, clearing selection`
        );
        localStorage.removeItem("selectedProductId");
        setSelectedProductId(null);
        setSelectedProduct(null);
        return {
          success: false,
          error: `Product with ID ${productId} does not exist`,
        };
      }

      // Update the ID atom immediately for better UX
      setSelectedProductId(productId);

      // Explicitly update localStorage for consistency
      // (even though atomWithStorage should handle this)
      localStorage.setItem("selectedProductId", productId);

      // Check cache first (both Map cache and existing products array)
      if (productCacheRef.current.has(productId)) {
        const cachedProduct = productCacheRef.current.get(productId)!;
        console.log("[useProduct] Using cached product:", cachedProduct.name);
        setSelectedProduct(cachedProduct);
        return { success: true, product: cachedProduct };
      }

      // If not in Map cache, check products array (in-memory state)
      const existingProduct = products.find((p) => p.id === productId);
      if (existingProduct) {
        console.log(
          "[useProduct] Found product in state:",
          existingProduct.name
        );
        // Cache it for future lookups
        productCacheRef.current.set(productId, existingProduct);
        setSelectedProduct(existingProduct);
        return { success: true, product: existingProduct };
      }

      // If not found in any cache, fetch from API
      // Don't check fetchingRef here to avoid errors on page refresh
      console.log("[useProduct] Product not in cache, fetching from API");
      try {
        const result = await fetchProductById(productId);
        if (result.success && result.product) {
          console.log(
            "[useProduct] Successfully fetched product:",
            (result.product as Product).name
          );
          setSelectedProduct(result.product as Product);
          return result;
        } else {
          console.error("[useProduct] Failed to fetch product:", result.error);
          // Clear the selection if the product doesn't exist
          localStorage.removeItem("selectedProductId");
          setSelectedProductId(null);
          setSelectedProduct(null);
          return result;
        }
      } catch (error) {
        console.error("[useProduct] Error fetching product:", error);
        localStorage.removeItem("selectedProductId");
        setSelectedProductId(null);
        setSelectedProduct(null);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    [
      selectedProductId,
      selectedProduct?.id,
      products,
      setSelectedProductId,
      setSelectedProduct,
      fetchProductById,
    ]
  );

  // Initialize products data on first mount
  useEffect(() => {
    // Only fetch if we have no products, aren't currently loading, and haven't attempted a fetch yet
    if (
      !isLoading &&
      products.length === 0 &&
      !fetchingRef.current &&
      !initialFetchAttemptedRef.current
    ) {
      console.log("[useProducts] Initial product fetch");
      fetchProducts().catch((err) => {
        console.error("[useProducts] Error during initial fetch:", err);
      });
    }
  }, [fetchProducts, isLoading, products.length]);

  // Handle selected product loading
  useEffect(() => {
    console.log("[USE EFFECT] selectedProductId changed:", selectedProduct);
    // Skip if no product ID is selected or product already matches ID
    if (
      !selectedProductId ||
      selectedProduct?.id === selectedProductId ||
      nonExistentProductIdsRef.current.has(selectedProductId)
    ) {
      return;
    }

    // Get product data if needed - don't check isLoading or fetchingRef here
    // to avoid issues on page refresh where multiple components may attempt to load
    console.log("[useProducts] Loading selected product:", selectedProductId);
    // Use a local variable to track if this effect instance is still relevant
    let isCurrent = true;
    selectProduct(selectedProductId).catch((err) => {
      console.error("[useProducts] Error loading selected product:", err);
      // Only clear selection if this effect instance is still relevant
      if (isCurrent) {
        setSelectedProductId(null);
        setSelectedProduct(null);
      }
    });
    // Cleanup function to prevent state updates if the effect re-runs or unmounts
    return () => {
      isCurrent = false;
    };
  }, [
    selectedProductId,
    selectedProduct?.id,
    selectProduct,
    setSelectedProductId,
    setSelectedProduct,
  ]);

  // Memoize return values to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      products,
      selectedProduct,
      selectedProductId,
      isLoading,
      hasProducts,
      error,
      fetchProducts,
      fetchProductById,
      selectProduct,
      setSelectedProductId,
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
      fetchProductById,
      selectProduct,
      setSelectedProductId,
      setSelectedProduct,
    ]
  );

  return returnValue;
}
