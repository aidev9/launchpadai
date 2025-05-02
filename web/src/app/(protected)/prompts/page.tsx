"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import { PhaseFilter } from "@/components/prompts/phase-filter";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Prompt } from "@/lib/firebase/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function PromptsBrowse() {
  const router = useRouter();
  const {
    prompts,
    isLoading,
    error,
    phaseFilter,
    setPhaseFilter,
    searchQuery,
    setSearchQuery,
    setSelectedPrompt,
  } = usePrompts();

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    router.push("/prompts/prompt");
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Prompts", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Phase filter pills */}
        <PhaseFilter selectedPhases={phaseFilter} onChange={setPhaseFilter} />

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && prompts.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">No prompts found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Prompt cards grid */}
        {!isLoading && !error && prompts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onClick={handlePromptClick}
              />
            ))}
          </div>
        )}
      </div>
    </Main>
  );
}
