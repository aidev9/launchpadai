"use client";

import { Main } from "@/components/layout/main";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  appTemplates,
  agentTemplates,
  integrationTemplates,
  Template,
} from "./data/templates";
import { PlusCircle, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cn } from "@/lib/utils";
import { AlphaWarningAlert } from "@/components/alpha-warning-alert";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function Welcome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"]);
  const router = useRouter();

  // Pills for filtering
  const pillOptions = [
    { label: "All", value: "all" },
    { label: "Apps", value: "app" },
    { label: "AI Agents", value: "agent" },
    { label: "Integrations", value: "integration" },
  ];

  // Handle pill selection
  const handlePillClick = (value: string) => {
    if (value === "all") {
      setSelectedTypes(["all"]);
    } else {
      let newTypes = selectedTypes.includes(value)
        ? selectedTypes.filter((t) => t !== value)
        : [...selectedTypes.filter((t) => t !== "all"), value];
      if (newTypes.length === 0) newTypes = ["all"];
      setSelectedTypes(newTypes);
    }
  };

  // Filter templates based on pills and search
  const allTemplatesArr = [
    ...appTemplates,
    ...agentTemplates,
    ...integrationTemplates,
  ];
  const filteredTemplates = allTemplatesArr.filter((template) => {
    const matchesType =
      selectedTypes.includes("all") || selectedTypes.includes(template.type);
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      template.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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
    <Main>
      <AlphaWarningAlert />
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

        {/* Pills and Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-3xl mx-auto mb-4">
          <div className="flex flex-wrap gap-2">
            {pillOptions.map((pill) => (
              <button
                key={pill.value}
                type="button"
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                  selectedTypes.includes(pill.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                )}
                onClick={() => handlePillClick(pill.value)}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Templates Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            {selectedTypes.includes("all")
              ? "All Templates"
              : pillOptions
                  .filter(
                    (p) => p.value !== "all" && selectedTypes.includes(p.value)
                  )
                  .map((p) => p.label)
                  .join(", ") + " Templates"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleTemplateSelect(template)}
                />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground py-8">
                No templates found matching your search.
              </p>
            )}
          </div>
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
