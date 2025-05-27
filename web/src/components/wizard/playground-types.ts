/**
 * Shared types for playground data
 */

export type PlaygroundPromptTemplate = {
  id: string;
  name: string;
  promptTemplate: string;
};

export type PlaygroundCategory = {
  id: string;
  name: string;
  subcategories: PlaygroundPromptTemplate[];
};
