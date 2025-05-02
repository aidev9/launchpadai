"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search as SearchIcon } from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import { PhaseFilter } from "@/components/prompts/phase-filter";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Prompt } from "@/lib/firebase/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyPrompts() {
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
  } = usePrompts({ userPromptsOnly: true });

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    // TODO: Implement edit mode for user prompts
    router.push("/myprompts/prompt");
  };

  const handleCreatePrompt = () => {
    // TODO: Implement create new prompt functionality
    console.log("Create new prompt");
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Prompts", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Prompts</h1>
          <Button onClick={handleCreatePrompt} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create New Prompt
          </Button>
        </div>

        {/* Filter and Search row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Phase filter pills */}
          <div className="w-full md:flex-1 overflow-x-auto pb-2">
            <div className="inline-flex md:flex flex-nowrap md:flex-wrap">
              <PhaseFilter
                selectedPhases={phaseFilter}
                onChange={setPhaseFilter}
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter my prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
            <h2 className="text-xl font-semibold">No personal prompts found</h2>
            <p className="text-muted-foreground mt-2">
              Create a new prompt or copy one from the public collection
            </p>
            <Button
              onClick={() => router.push("/prompts")}
              variant="outline"
              className="mt-4"
            >
              Browse Public Prompts
            </Button>
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
