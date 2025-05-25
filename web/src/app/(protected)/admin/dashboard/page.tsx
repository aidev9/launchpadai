"use client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminTabs } from "../components/admin-tabs";
import { GeneralTab } from "../components/tabs/general-tab";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const isAdmin = useAtomValue(isAdminAtom);
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (isAdmin === false) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);

  if (isAdmin === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
          ]}
        />
      </div>

      {/* Tabs */}
      <AdminTabs />

      {/* General Tab Content */}
      <GeneralTab />
    </div>
  );
}
