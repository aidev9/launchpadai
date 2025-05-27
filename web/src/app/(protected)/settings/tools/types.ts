export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  apiKeyRequired: boolean;
  isEnabled: boolean;
  apiKey?: string;
  lastTested?: Date;
  testStatus?: "success" | "error" | "pending" | "never";
  testMessage?: string;
  tested?: boolean;
  configFields?: ToolConfigField[];
}

export interface ToolConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "select";
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

export interface ToolTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

export interface SaveToolConfigInput {
  toolId: string;
  isEnabled: boolean;
  apiKey?: string;
  config?: Record<string, string>;
}
