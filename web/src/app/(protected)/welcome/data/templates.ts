import {
  AppWindow,
  Bot,
  Link,
  ShoppingCart,
  Store,
  GanttChart,
  Building,
  Workflow,
  Stethoscope,
  Code,
  Headset,
} from "lucide-react";

export type TemplateType = "app" | "agent" | "integration";

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  icon: React.ComponentType;
  tags: string[];
}

// App templates
export const appTemplates: Template[] = [
  {
    id: "saas-business",
    name: "SaaS Business",
    type: "app",
    description:
      "Create a subscription-based software service with user management, billing, and analytics",
    icon: AppWindow,
    tags: ["business", "subscription", "web app"],
  },
  {
    id: "ecommerce-platform",
    name: "E-commerce Platform",
    type: "app",
    description:
      "Build an online store with product catalog, shopping cart, and payment processing",
    icon: ShoppingCart,
    tags: ["retail", "products", "payments"],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    type: "app",
    description:
      "Create a platform connecting buyers and sellers with listings, reviews, and transactions",
    icon: Store,
    tags: ["platform", "two-sided market", "community"],
  },
  {
    id: "shopify-site",
    name: "Shopify Site",
    type: "app",
    description:
      "Launch a Shopify-powered online store with theme customization and app integrations",
    icon: ShoppingCart,
    tags: ["retail", "e-commerce", "Shopify"],
  },
  {
    id: "wordpress-site",
    name: "Wordpress Site",
    type: "app",
    description:
      "Build a customizable website with content management, plugins, and themes",
    icon: AppWindow,
    tags: ["content", "blog", "CMS"],
  },
  {
    id: "marketing-mini-site",
    name: "Marketing Mini-site",
    type: "app",
    description:
      "Create a focused landing page for marketing campaigns with lead capture and analytics",
    icon: GanttChart,
    tags: ["marketing", "leads", "conversion"],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    type: "app",
    description:
      "Design a conversion-focused landing page with call-to-action, benefits, and testimonials",
    icon: Building,
    tags: ["marketing", "conversion", "single-page"],
  },
];

// Agent templates
export const agentTemplates: Template[] = [
  {
    id: "langgraph-agent",
    name: "LangGraph Agent",
    type: "agent",
    description:
      "Build a multi-step AI workflow with dynamic reasoning paths using LangGraph",
    icon: Workflow,
    tags: ["AI", "workflow", "reasoning"],
  },
  {
    id: "crewai-agent",
    name: "CrewAI Agent",
    type: "agent",
    description:
      "Create a team of specialized AI agents that collaborate on complex tasks",
    icon: Bot,
    tags: ["AI", "collaboration", "multi-agent"],
  },
  {
    id: "pydanticai-agent",
    name: "PydanticAI Agent",
    type: "agent",
    description:
      "Develop a structured data-driven AI agent with validated inputs and outputs",
    icon: Code,
    tags: ["AI", "structured data", "validation"],
  },
  {
    id: "customer-service-agent",
    name: "Customer Service Agent",
    type: "agent",
    description:
      "Deploy an AI assistant to handle customer inquiries, support tickets, and FAQs",
    icon: Headset,
    tags: ["customer support", "chat", "automation"],
  },
  {
    id: "medical-agent",
    name: "Medical Agent",
    type: "agent",
    description:
      "Create an AI assistant for medical information, symptom analysis, and health recommendations",
    icon: Stethoscope,
    tags: ["healthcare", "medical", "advisory"],
  },
];

// Integration templates
export const integrationTemplates: Template[] = [
  {
    id: "n8n",
    name: "N8N",
    type: "integration",
    description:
      "Connect your app to N8N workflow automation platform for powerful no-code integrations",
    icon: Workflow,
    tags: ["automation", "workflow", "no-code"],
  },
  {
    id: "dify",
    name: "Dify",
    type: "integration",
    description:
      "Build LLM applications with visual tools for prompt engineering and data management",
    icon: Bot,
    tags: ["AI", "prompt engineering", "LLM"],
  },
  {
    id: "flowise",
    name: "Flowise",
    type: "integration",
    description:
      "Create customizable AI flows with a drag-and-drop interface for your applications",
    icon: Workflow,
    tags: ["AI", "no-code", "workflow"],
  },
  {
    id: "zapier",
    name: "Zapier",
    type: "integration",
    description:
      "Connect your app to thousands of other services with Zapier's automation platform",
    icon: Link,
    tags: ["automation", "integration", "workflow"],
  },
];

// All templates combined
export const allTemplates: Template[] = [
  ...appTemplates,
  ...agentTemplates,
  ...integrationTemplates,
];
