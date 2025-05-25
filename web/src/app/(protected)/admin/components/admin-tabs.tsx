"use client";

import { useAtom } from "jotai";
import { activeAdminTabAtom, AdminTab } from "../admin-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Users,
  Package,
  Lightbulb,
  Layers,
  FolderOpen,
  Bot,
} from "lucide-react";

export function AdminTabs() {
  const [activeTab, setActiveTab] = useAtom(activeAdminTabAtom);

  const handleTabChange = (value: string) => {
    setActiveTab(value as AdminTab);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full mb-6"
    >
      <TabsList className="grid grid-cols-7 w-full">
        <TabsTrigger
          value="general"
          className="flex items-center gap-1 sm:gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-xs sm:text-sm">General</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2">
          <Users className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Users</span>
        </TabsTrigger>
        <TabsTrigger
          value="products"
          className="flex items-center gap-1 sm:gap-2"
        >
          <Package className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Products</span>
        </TabsTrigger>
        <TabsTrigger
          value="prompts"
          className="flex items-center gap-1 sm:gap-2"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Prompts</span>
        </TabsTrigger>
        <TabsTrigger
          value="stacks"
          className="flex items-center gap-1 sm:gap-2"
        >
          <Layers className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Stacks</span>
        </TabsTrigger>
        <TabsTrigger
          value="collections"
          className="flex items-center gap-1 sm:gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Collections</span>
        </TabsTrigger>
        <TabsTrigger
          value="agents"
          className="flex items-center gap-1 sm:gap-2"
        >
          <Bot className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Agents</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
