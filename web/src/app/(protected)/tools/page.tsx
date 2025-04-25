"use client";

import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function ToolsPage() {
  return (
    <Main>
      <div className="space-y-6">
        {/* Breadcrumbs navigation */}
        <div className="flex flex-col space-y-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "Tools", href: "", isCurrentPage: true },
            ]}
          />
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        </div>

        <p className="text-muted-foreground">
          Specialized tools to help you build and grow your product
        </p>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Naming Assistant Tool Card */}
          <Link href="/tools/naming-assistant" className="group">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    Naming Assistant
                  </CardTitle>
                  <CardDescription>
                    Find the perfect name for your startup or product
                  </CardDescription>
                </div>
                <div className="p-2 bg-primary-50 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Chat with our AI assistant to generate creative and available
                  name suggestions based on your business description.
                </p>
              </CardContent>
              <CardFooter>
                <Badge variant="secondary" className="text-xs">
                  AI-Powered
                </Badge>
              </CardFooter>
            </Card>
          </Link>
        </div>
      </div>
    </Main>
  );
}
