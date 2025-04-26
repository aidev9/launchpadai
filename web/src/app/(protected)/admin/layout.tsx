"use client";

import { Main } from "@/components/layout/main";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Main fullWidth>{children}</Main>;
}
