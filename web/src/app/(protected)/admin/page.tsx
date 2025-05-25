"use client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminTabs } from "./components/admin-tabs";
import { GeneralTab } from "./components/tabs/general-tab";
import { UsersTab } from "./components/tabs/users-tab";
import { ProductsTab } from "./components/tabs/products-tab";
import { PromptsTab } from "./components/tabs/prompts-tab";
import { StacksTab } from "./components/tabs/stacks-tab";
import { CollectionsTab } from "./components/tabs/collections-tab";
import { AgentsTab } from "./components/tabs/agents-tab";
import { useAtom } from "jotai";
import { activeAdminTabAtom, AdminTab } from "./admin-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function AdminDashboard() {
  const [activeTab] = useAtom(activeAdminTabAtom);

  // Reset selected items when changing tabs
  useEffect(() => {
    // This is just to log the active tab for debugging
    console.log("Active tab:", activeTab);
  }, [activeTab]);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab />;
      case "users":
        return <UsersTab />;
      case "products":
        return <ProductsTab />;
      case "prompts":
        return <PromptsTab />;
      case "stacks":
        return <StacksTab />;
      case "collections":
        return <CollectionsTab />;
      case "agents":
        return <AgentsTab />;
      default:
        return <GeneralTab />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
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

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </QueryClientProvider>
  );
}
