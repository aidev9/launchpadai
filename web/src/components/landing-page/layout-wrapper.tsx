"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { smoothScrollToSection } from "@/utils/scroll-utils";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Handle URL hash changes
  useEffect(() => {
    // Handle initial load with hash in URL
    if (window.location.hash) {
      const sectionId = window.location.hash.substring(1); // Remove the # character
      setTimeout(() => {
        smoothScrollToSection(sectionId);
      }, 500); // Slight delay to ensure page is fully loaded
    }

    // Handle hash changes
    const handleHashChange = () => {
      if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        smoothScrollToSection(sectionId);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname]);

  return <>{children}</>;
}
