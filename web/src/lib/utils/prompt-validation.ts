import { z } from "zod";
import { Prompt, PhaseTag } from "@/lib/firebase/schema";

/**
 * Validate phase tag values
 */
export function validatePhaseTag(tag: string): tag is PhaseTag {
  const validTags = [
    "Discover",
    "Validate",
    "Design",
    "Build",
    "Secure",
    "Launch",
    "Grow",
  ];
  return validTags.includes(tag);
}

/**
 * Check if two prompts are equal (for optimistic updates)
 */
export function arePromptsEqual(a: Prompt, b: Prompt): boolean {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.body === b.body &&
    arraysEqual(a.phaseTags, b.phaseTags) &&
    arraysEqual(a.productTags, b.productTags) &&
    arraysEqual(a.tags, b.tags)
  );
}

/**
 * Helper to check if arrays are equal
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Search and filter prompts based on criteria
 */
export function searchAndFilterPrompts(
  prompts: Prompt[],
  searchQuery: string,
  phases: string[]
): Prompt[] {
  // Filter by phases if any phases are selected
  let filtered =
    phases.length > 0
      ? prompts.filter((prompt) => {
          return prompt.phaseTags.some((tag) => phases.includes(tag));
        })
      : prompts;

  // Further filter by search query if provided
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.body.toLowerCase().includes(query) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        prompt.productTags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
}
