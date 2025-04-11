"use client";

import { Provider } from "jotai";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <Provider>{children}</Provider>;
}
