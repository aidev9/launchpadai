"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search as SearchIcon,
  X,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { TechStack } from "@/lib/firebase/schema";
import { getAllTechStacks } from "@/lib/firebase/techstacks";
import { PhaseFilter } from "@/components/prompts/phase-filter";
import {
  techStackLayoutViewAtom,
  techStackPhaseFilterAtom,
  techStackSearchQueryAtom,
  selectedTechStackAtom,
} from "@/lib/store/techstack-store";

export default function MyTechStacks() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView, setLayoutView] = useAtom(techStackLayoutViewAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(techStackPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(techStackSearchQueryAtom);
  const [, setSelectedTechStack] = useAtom(selectedTechStackAtom);

  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tech stacks
  useEffect(() => {
    const fetchTechStacks = async () => {
      setIsLoading(true);
      try {
        const result = await getAllTechStacks();
        if (result.success && result.techStacks) {
          setTechStacks(result.techStacks);
        } else {
          setError(result.error || "Failed to fetch tech stacks");
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechStacks();
  }, []);

  // Filter tech stacks based on search query and phase filter
  const filteredTechStacks = techStacks.filter((stack) => {
    // Apply phase filter
    if (
      phaseFilter.length > 0 &&
      !stack.phase.some((p) => phaseFilter.includes(p))
    ) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        stack.name.toLowerCase().includes(query) ||
        stack.description?.toLowerCase().includes(query) ||
        stack.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleCreateTechStack = () => {
    router.push("/mystacks/create");
  };

  const handleTechStackClick = (techStack: TechStack) => {
    setSelectedTechStack(techStack);
    router.push("/mystacks/stack");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Tech Stacks", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Tech Stacks</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreateTechStack}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Tech Stack
            </Button>
          </div>
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

          {/* Search bar and view toggles */}
          <div className="flex gap-2 w-full md:w-auto">
            {/* Search bar */}
            <div className="relative w-full md:w-[18rem] flex-shrink-0">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter tech stacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View toggle buttons */}
            <div className="flex border rounded-md">
              <Button
                variant={layoutView === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("card")}
                className="rounded-r-none"
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutView === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("table")}
                className="rounded-l-none"
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
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
        {!isLoading && !error && filteredTechStacks.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">No tech stacks found</h2>
            <p className="text-muted-foreground mt-2">
              Create a new tech stack to get started
            </p>
            <Button
              onClick={handleCreateTechStack}
              variant="outline"
              className="mt-4"
            >
              Create Tech Stack
            </Button>
          </div>
        )}

        {/* Tech stack cards grid */}
        {!isLoading &&
          !error &&
          filteredTechStacks.length > 0 &&
          layoutView === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTechStacks.map((techStack) => (
                <div
                  key={techStack.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleTechStackClick(techStack)}
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{techStack.name}</h3>
                    <p className="text-muted-foreground line-clamp-2 mt-1">
                      {techStack.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {techStack.phase.map((phase) => (
                        <span
                          key={phase}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {phase}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 pt-2 border-t flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {techStack.appType}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {techStack.frontEndStack}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Table view */}
        {!isLoading &&
          !error &&
          filteredTechStacks.length > 0 &&
          layoutView === "table" && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">App Type</th>
                    <th className="text-left p-3 font-medium">Front End</th>
                    <th className="text-left p-3 font-medium">Backend</th>
                    <th className="text-left p-3 font-medium">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTechStacks.map((techStack) => (
                    <tr
                      key={techStack.id}
                      className="border-t hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleTechStackClick(techStack)}
                    >
                      <td className="p-3">{techStack.name}</td>
                      <td className="p-3">{techStack.appType}</td>
                      <td className="p-3">{techStack.frontEndStack}</td>
                      <td className="p-3">{techStack.backendStack}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {techStack.phase.map((phase) => (
                            <span
                              key={phase}
                              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                            >
                              {phase}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </Main>
  );
}
