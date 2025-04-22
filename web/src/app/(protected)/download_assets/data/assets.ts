export interface Asset {
  id: string;
  phase:
    | "Discover"
    | "Validate"
    | "Design"
    | "Build"
    | "Secure"
    | "Launch"
    | "Grow";
  name: string;
  size: string;
  category: string;
}

// Sample assets for demonstration - in a real app these would come from Firebase
export const phases = [
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];

export const assets: Asset[] = [
  // Discover Phase Assets
  {
    id: "1",
    phase: "Discover",
    name: "Business Plan.md",
    size: "45 KB",
    category: "planning",
  },
  {
    id: "2",
    phase: "Discover",
    name: "Executive Summary.md",
    size: "12 KB",
    category: "planning",
  },
  {
    id: "3",
    phase: "Discover",
    name: "Market Analysis.md",
    size: "28 KB",
    category: "planning",
  },
  {
    id: "4",
    phase: "Discover",
    name: "SWOT Analysis.md",
    size: "18 KB",
    category: "planning",
  },

  // Validate Phase Assets
  {
    id: "5",
    phase: "Validate",
    name: "Marketing Strategy.md",
    size: "38 KB",
    category: "marketing",
  },
  {
    id: "6",
    phase: "Validate",
    name: "Brand Guidelines.md",
    size: "22 KB",
    category: "marketing",
  },
  {
    id: "7",
    phase: "Validate",
    name: "Competitive Analysis.md",
    size: "34 KB",
    category: "planning",
  },
  {
    id: "8",
    phase: "Validate",
    name: "Customer Persona.md",
    size: "26 KB",
    category: "marketing",
  },

  // Design Phase Assets
  {
    id: "9",
    phase: "Design",
    name: "Product Specification.md",
    size: "42 KB",
    category: "product",
  },
  {
    id: "10",
    phase: "Design",
    name: "UI/UX Guidelines.md",
    size: "31 KB",
    category: "product",
  },
  {
    id: "11",
    phase: "Design",
    name: "Wireframes.md",
    size: "37 KB",
    category: "product",
  },
  {
    id: "12",
    phase: "Design",
    name: "Content Strategy.md",
    size: "25 KB",
    category: "marketing",
  },

  // Build Phase Assets
  {
    id: "13",
    phase: "Build",
    name: "Technical Architecture.md",
    size: "49 KB",
    category: "product",
  },
  {
    id: "14",
    phase: "Build",
    name: "Development Roadmap.md",
    size: "33 KB",
    category: "product",
  },
  {
    id: "15",
    phase: "Build",
    name: "Sprint Plan.md",
    size: "27 KB",
    category: "planning",
  },
  {
    id: "16",
    phase: "Build",
    name: "API Documentation.md",
    size: "44 KB",
    category: "product",
  },

  // Secure Phase Assets
  {
    id: "17",
    phase: "Secure",
    name: "Security Protocol.md",
    size: "36 KB",
    category: "finance",
  },
  {
    id: "18",
    phase: "Secure",
    name: "Privacy Policy.md",
    size: "29 KB",
    category: "finance",
  },
  {
    id: "19",
    phase: "Secure",
    name: "Data Protection Plan.md",
    size: "32 KB",
    category: "finance",
  },
  {
    id: "20",
    phase: "Secure",
    name: "Compliance Checklist.md",
    size: "24 KB",
    category: "finance",
  },

  // Launch Phase Assets
  {
    id: "21",
    phase: "Launch",
    name: "Go-to-Market Strategy.md",
    size: "41 KB",
    category: "marketing",
  },
  {
    id: "22",
    phase: "Launch",
    name: "Press Release.md",
    size: "19 KB",
    category: "marketing",
  },
  {
    id: "23",
    phase: "Launch",
    name: "Launch Timeline.md",
    size: "25 KB",
    category: "planning",
  },
  {
    id: "24",
    phase: "Launch",
    name: "Marketing Collateral.md",
    size: "38 KB",
    category: "marketing",
  },

  // Grow Phase Assets
  {
    id: "25",
    phase: "Grow",
    name: "Growth Strategy.md",
    size: "40 KB",
    category: "marketing",
  },
  {
    id: "26",
    phase: "Grow",
    name: "Funding Pitch Deck.md",
    size: "35 KB",
    category: "finance",
  },
  {
    id: "27",
    phase: "Grow",
    name: "Sales Strategy.md",
    size: "30 KB",
    category: "marketing",
  },
  {
    id: "28",
    phase: "Grow",
    name: "Expansion Plan.md",
    size: "43 KB",
    category: "planning",
  },
];

// Helper function to get assets by phase
export function getAssetsByPhase(phase: Asset["phase"]) {
  return assets.filter((asset) => asset.phase === phase);
}

// Helper function to get assets by phases (multiple selection)
export function getAssetsByPhases(phases: Asset["phase"][]) {
  return phases.length > 0
    ? assets.filter((asset) => phases.includes(asset.phase))
    : assets;
}

// Asset categories for organization
export const assetCategories = [
  {
    id: "planning",
    name: "Planning Documents",
    description: "Business plans and strategic documents",
  },
  {
    id: "marketing",
    name: "Marketing Materials",
    description: "Materials for marketing your product",
  },
  {
    id: "finance",
    name: "Financial Documents",
    description: "Financial projections and models",
  },
  {
    id: "product",
    name: "Product Development",
    description: "Documents related to your product",
  },
];
