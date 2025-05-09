import { Asset } from "@/lib/firebase/schema";

// Default assets template - used for initializing new products
export const assets: Asset[] = [
  // Discover Phase Assets
  {
    id: "asset1",
    phase: "Discover",
    document: "Business Plan.md",
    systemPrompt:
      "Generate a comprehensive business plan for the startup based on their product description, target market, and problem statement. Include executive summary, business model, go-to-market strategy, and financial projections.",
    order: 10,
  },
  {
    id: "asset2",
    phase: "Discover",
    document: "Market Analysis.md",
    systemPrompt:
      "Generate a detailed market analysis for the startup based on their product description and target audience. Include market size, trends, potential growth, and barriers to entry.",
    order: 20,
  },

  // Validate Phase Assets
  {
    id: "asset3",
    phase: "Validate",
    document: "Competitive Analysis.md",
    systemPrompt:
      "Create a comprehensive competitive analysis for the startup. Identify key competitors, their strengths and weaknesses, and how the startup differentiates itself in the market.",
    order: 30,
  },
  {
    id: "asset4",
    phase: "Validate",
    document: "Customer Persona.md",
    systemPrompt:
      "Generate detailed customer personas for the startup based on their target audience description. Include demographics, psychographics, goals, pain points, and buying patterns.",
    order: 40,
  },

  // Design Phase Assets
  {
    id: "asset5",
    phase: "Design",
    document: "Product Specification.md",
    systemPrompt:
      "Create a detailed product specification document that outlines the key features, functionality, and technical requirements based on the startup's product description.",
    order: 50,
  },
  {
    id: "asset6",
    phase: "Design",
    document: "Brand Guidelines.md",
    systemPrompt:
      "Generate comprehensive brand guidelines for the startup including tone of voice, messaging framework, and visual identity recommendations.",
    order: 60,
  },

  // Build Phase Assets
  {
    id: "asset7",
    phase: "Build",
    document: "Technical Architecture.md",
    systemPrompt:
      "Create a technical architecture document that outlines the technology stack, infrastructure, and system design for the startup's product.",
    order: 70,
  },
  {
    id: "asset8",
    phase: "Build",
    document: "Development Roadmap.md",
    systemPrompt:
      "Generate a development roadmap that outlines the phases, milestones, and timeline for building the startup's product.",
    order: 80,
  },

  // Secure Phase Assets
  {
    id: "asset9",
    phase: "Secure",
    document: "Security Protocol.md",
    systemPrompt:
      "Create a comprehensive security protocol document for the startup's product. Include data protection measures, authentication protocols, and compliance requirements.",
    order: 90,
  },
  {
    id: "asset10",
    phase: "Secure",
    document: "Privacy Policy.md",
    systemPrompt:
      "Generate a detailed privacy policy for the startup based on their product type and data handling practices. Ensure compliance with relevant regulations.",
    order: 100,
  },

  // Launch Phase Assets
  {
    id: "asset11",
    phase: "Launch",
    document: "Go-to-Market Strategy.md",
    systemPrompt:
      "Create a detailed go-to-market strategy for the startup. Include launch timeline, marketing channels, messaging, and success metrics.",
    order: 110,
  },
  {
    id: "asset12",
    phase: "Launch",
    document: "Press Release.md",
    systemPrompt:
      "Generate a compelling press release for the startup's product launch. Highlight the unique value proposition, key features, and impact on the target market.",
    order: 120,
  },

  // Grow Phase Assets
  {
    id: "asset13",
    phase: "Grow",
    document: "Growth Strategy.md",
    systemPrompt:
      "Create a growth strategy document for the startup that outlines customer acquisition, retention, and expansion strategies.",
    order: 130,
  },
  {
    id: "asset14",
    phase: "Grow",
    document: "Funding Pitch Deck.md",
    systemPrompt:
      "Generate a compelling funding pitch deck for the startup. Include problem, solution, market opportunity, business model, traction, and funding needs.",
    order: 140,
  },
];

// Helper function to get assets by phase from Firestore - client import
export async function getFirestoreAssetsByPhase(
  productId: string,
  phase: Asset["phase"]
) {
  const { getAssetsByPhase } = await import("@/lib/firebase/assets");
  return getAssetsByPhase(productId, phase);
}
