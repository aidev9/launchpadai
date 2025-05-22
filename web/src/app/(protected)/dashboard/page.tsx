"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, PenTool, Layers, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const router = useRouter();

  const handleNavigateToProducts = () => {
    router.push("/myproducts");
  };

  const handleNavigateToPrompts = () => {
    router.push("/myprompts");
  };

  const handleNavigateToStacks = () => {
    router.push("/mystacks");
  };

  return (
    <Main data-testid="dashboard-page">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Launchpad dashboard. Access your products, prompts,
          and other resources.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleNavigateToProducts}
          >
            <CardHeader className="pb-2">
              <Building className="h-6 w-6 text-primary mb-2" />
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                Manage your products and creations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Products
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleNavigateToPrompts}
          >
            <CardHeader className="pb-2">
              <PenTool className="h-6 w-6 text-primary mb-2" />
              <CardTitle>My Prompts</CardTitle>
              <CardDescription>Browse and manage your prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Prompts
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleNavigateToStacks}
          >
            <CardHeader className="pb-2">
              <Layers className="h-6 w-6 text-primary mb-2" />
              <CardTitle>My Stacks</CardTitle>
              <CardDescription>Manage your tech stacks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Stacks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  );
}
