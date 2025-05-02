import { Model } from "@/lib/firebase/schema";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// export const types = ["GPT-3", "Codex"] as const;

// export type ModelType = (typeof types)[number];

// Available models
export const availableModels: Model[] = [
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    provider: "OpenAI",
    type: "gpt",
    description: "Fastest and most cost-effective model in the GPT-4 family",
    strengths:
      "Fast response times, cost-effective, and capable of handling a wide range of tasks.",
    maxTokens: 4096,
    active: true,
  },
  {
    id: "gpt-4.1-nano",
    name: "gpt-4.1-nano",
    provider: "OpenAI",
    type: "gpt",
    description:
      "OpenAI's new GPT-4 model, designed for a wide range of tasks. Smaller and faster than GPT-4o.",
    strengths:
      "Language understanding, generation, and reasoning. Smaller and faster than GPT-4o.",
    maxTokens: 8192,
    active: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "gpt-3.5-turbo",
    provider: "OpenAI",
    type: "gpt",
    description: "Great balance of intelligence and speed",
    strengths:
      "Language understanding, generation, and reasoning. Great balance of intelligence and speed.",
    maxTokens: 4096,
    active: true,
  },
  {
    id: "gpt-3.5-turbo-16k",
    name: "gpt-3.5-turbo-16k",
    provider: "OpenAI",
    type: "gpt",
    description: "Extended context length for more complex tasks",
    strengths:
      "Language understanding, generation, and reasoning. Extended context length for more complex tasks.",
    maxTokens: 16384,
    active: true,
  },
  {
    id: "claude-3.5",
    name: "claude-3.5",
    provider: "Anthropic",
    type: "claude",
    description:
      "Anthropic's most advanced model, designed for safety and reliability. Technically superior to GPT-4o.",
    strengths: "Complex tasks, nuanced understanding, safety, and reliability.",
    maxTokens: 8192,
    active: false,
  },
  {
    id: "claude-3.7",
    name: "claude-3.7",
    provider: "Anthropic",
    type: "claude",
    description:
      "Best for complex tasks and nuanced understanding. Technically superior to GPT-4o.",
    strengths: "Complex tasks, nuanced understanding, safety, and reliability.",
    maxTokens: 100000,
    active: false,
  },
  {
    id: "gemini-2.0",
    name: "gemini-2.0",
    provider: "Google",
    type: "google",
    description:
      "Google's most advanced model, designed for a wide range of tasks. Technically superior to GPT-4o.",
    strengths: "Complex tasks, nuanced understanding, safety, and reliability.",
    maxTokens: 8192,
    active: false,
  },
  {
    id: "gemini-2.5",
    name: "gemini-2.5",
    provider: "Google",
    type: "google",
    description:
      "Best for complex tasks and nuanced understanding. Technically superior to GPT-4o.",
    strengths: "Complex tasks, nuanced understanding, safety, and reliability.",
    maxTokens: 100000,
    active: false,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "llama-3.3-70b-versatile",
    provider: "Groq",
    type: "groq",
    description:
      "Llama's most advanced model, designed for a wide range of tasks. Technically superior to GPT-4o.",
    strengths: "Language understanding, generation, and reasoning.",
    maxTokens: 128000,
    active: false,
  },
  {
    id: "gemma2-9b-it",
    name: "gemma2-9b-it",
    provider: "Groq",
    type: "groq",
    description:
      "Gemma's most advanced model, designed for a wide range of tasks. Technically superior to GPT-4o.",
    strengths: "Language understanding, generation, and reasoning.",
    maxTokens: 8192,
    active: false,
  },
];

// Default values
const DEFAULT_MODEL = availableModels[0]; // GPT-4o Mini
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_LENGTH = 2048;
const DEFAULT_TOP_P = 0.9;

// Atoms with persistent storage (localStorage)
export const selectedModelAtom = atomWithStorage<Model>(
  "launchpadai-selected-model",
  DEFAULT_MODEL
);

export const temperatureAtom = atomWithStorage<number>(
  "launchpadai-temperature",
  DEFAULT_TEMPERATURE
);

export const maxLengthAtom = atomWithStorage<number>(
  "launchpadai-max-length",
  DEFAULT_MAX_LENGTH
);

export const topPAtom = atomWithStorage<number>(
  "launchpadai-top-p",
  DEFAULT_TOP_P
);

// Derived atom that provides all settings in one object
export const aiSettingsAtom = atom((get) => {
  return {
    model: get(selectedModelAtom),
    temperature: get(temperatureAtom),
    maxTokens: get(maxLengthAtom),
    topP: get(topPAtom),
  };
});
