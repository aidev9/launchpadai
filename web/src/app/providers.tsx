"use client";

import { Provider } from "jotai";
import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchProvider } from "@/context/search-context";
import { FontProvider } from "@/context/font-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHydrateAtoms } from "jotai/react/utils";
import { queryClientAtom } from "@/stores/promptCreditStore";

interface ProvidersProps {
  children: ReactNode;
}

function JotaiProvider({ children }: { children: ReactNode }) {
  // This ensures queryClient is properly hydrated into the queryClientAtom
  // before any components try to use it
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
}

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 10000,
    },
  },
});

export default function Providers({ children }: ProvidersProps) {
  // This prevents hydration mismatch by only rendering on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return early if not mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <SearchProvider>
              <JotaiProvider>{children}</JotaiProvider>
            </SearchProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
