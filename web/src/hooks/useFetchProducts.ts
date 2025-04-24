import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
};

export function useFetchProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return { products, productsLoading };
}
