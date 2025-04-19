"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Assuming ThemeProviderProps is available directly or use a simpler type
// import { type ThemeProviderProps } from "next-themes/dist/types"; // Reverted this import

// Define props inline to avoid deep import issues
interface CustomThemeProviderProps {
  children: React.ReactNode;
  // attribute?: string; // Removed, as it's explicitly set below
  // defaultTheme?: string; // Removed, as it's explicitly set below
  // enableSystem?: boolean; // Removed, as it's explicitly set below
  [key: string]: unknown; // Allow other props, use unknown instead of any
}

export function ThemeProvider({
  children,
  ...props
}: CustomThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
