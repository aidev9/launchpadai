"use client";

import { ReactNode } from "react";
import { Provider } from "jotai";

interface CoursesProviderProps {
  children: ReactNode;
}

export function CoursesProvider({ children }: CoursesProviderProps) {
  return <Provider>{children}</Provider>;
}
