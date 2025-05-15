export interface Preset {
  id: string;
  name: string;
  description?: string;
  config?: Record<string, any>;
}

export const presets: Preset[] = [
  {
    id: "default",
    name: "Default",
    description: "Default configuration",
    config: {
      // Add default configuration values here
    },
  },
  // Add more presets as needed
];

export default presets;
