"use client";

import { Provider } from "jotai";
import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchProvider } from "@/context/search-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import SkipToMain from "@/components/skip-to-main";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import { FontProvider } from "@/context/font-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: ReactNode;
}

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function Providers({ children }: ProvidersProps) {
  // This prevents hydration mismatch by only rendering on the client
  const [mounted, setMounted] = useState(false);
  const defaultOpen = Cookies.get("sidebar:state") !== "false";

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
              <SidebarProvider defaultOpen={defaultOpen}>
                <SkipToMain />
                <AppSidebar />
                <div
                  id="content"
                  className={cn(
                    "ml-auto w-full max-w-full",
                    "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
                    "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
                    "transition-[width] duration-200 ease-linear",
                    "flex h-svh flex-col",
                    "group-data-[scroll-locked=1]/body:h-full",
                    "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
                  )}
                >
                  {children}
                </div>
              </SidebarProvider>
            </SearchProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
