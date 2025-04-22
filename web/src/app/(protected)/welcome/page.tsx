"use client";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Provider } from "jotai";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  appTemplates,
  agentTemplates,
  integrationTemplates,
  Template,
} from "./data/templates";
import { PlusCircle, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { countProducts } from "@/lib/firebase/products";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Welcome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasProducts, setHasProducts] = useState(false);
  const router = useRouter();

  // Check if user has any products
  useEffect(() => {
    const checkProducts = async () => {
      const result = await countProducts();
      if (result.success && result.count > 0) {
        setHasProducts(true);
      }
    };

    checkProducts();
  }, []);

  // Filter templates based on search query
  const filterTemplates = (templates: Template[]) => {
    if (!searchQuery) return templates;

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        template.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Filtered template lists
  const filteredAppTemplates = filterTemplates(appTemplates);
  const filteredAgentTemplates = filterTemplates(agentTemplates);
  const filteredIntegrationTemplates = filterTemplates(integrationTemplates);

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    // Navigate to wizard with template selected
    router.push(
      `/welcome/wizard?template=${template.id}&type=${template.type}`
    );
  };

  // Handle start blank
  const handleStartBlank = () => {
    router.push(`/welcome/wizard?template=blank&type=blank`);
  };

  return (
    <Provider>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <div className="flex flex-col gap-8">
          {/* Breadcrumbs */}
          <div className="mb-2">
            <Breadcrumbs
              items={[
                { label: "Products", href: "/dashboard" },
                { label: "Welcome", href: "/welcome", isCurrentPage: true },
              ]}
            />
          </div>

          {/* Welcome Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to LaunchpadAI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Congratulations on taking the first step in your entrepreneurial
              journey! Let's help you
              <span className="font-semibold text-primary">
                {" "}
                create your startup or product in 60 seconds or less
              </span>
              .
            </p>
          </div>

          {/* Search and Filter */}
          <div className="relative w-full max-w-sm mx-auto">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Templates Section */}
          <div className="space-y-6">
            <Tabs defaultValue="apps" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="apps">Apps</TabsTrigger>
                <TabsTrigger value="agents">AI Agents</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              {/* Apps Tab */}
              <TabsContent value="apps" className="space-y-4">
                <h2 className="text-2xl font-semibold">App Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAppTemplates.length > 0 ? (
                    filteredAppTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleTemplateSelect(template)}
                      />
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-muted-foreground py-8">
                      No app templates found matching your search.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* AI Agents Tab */}
              <TabsContent value="agents" className="space-y-4">
                <h2 className="text-2xl font-semibold">AI Agent Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAgentTemplates.length > 0 ? (
                    filteredAgentTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleTemplateSelect(template)}
                      />
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-muted-foreground py-8">
                      No AI agent templates found matching your search.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  Integration Templates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIntegrationTemplates.length > 0 ? (
                    filteredIntegrationTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleTemplateSelect(template)}
                      />
                    ))
                  ) : (
                    <p className="col-span-3 text-center text-muted-foreground py-8">
                      No integration templates found matching your search.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Start Blank Section */}
          <div className="flex flex-col items-center mt-8 pb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Start From Scratch</h2>
              <p className="text-muted-foreground mt-2">
                Begin with a clean slate and build your product exactly how you
                want it.
              </p>
            </div>
            <Button size="lg" onClick={handleStartBlank}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Start Blank
            </Button>
          </div>
        </div>
      </Main>
    </Provider>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: () => void;
}) {
  // Add proper typing for the Icon component
  const Icon: React.ComponentType<{ className?: string }> = template.icon;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription className="line-clamp-3">
          {template.description}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
