"use client";

import { FeatureCard } from "./feature-card";

const featuresData = [
  {
    title: "Build Smarter",
    subtitle: "Create products 10x faster with AI assistance",
    description:
      "Access pre-built prompt libraries and AI tools that help you create products faster. From coding assistance to design generation, LaunchpadAI amplifies your building capabilities and helps you save 20+ hours per week on development tasks.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <path d="M11 11l4 4" />
      </svg>
    ),
  },
  {
    title: "Learn Continuously",
    subtitle: "Exclusive courses and AI implementation guides",
    description:
      "Never stop growing with our exclusive learning ecosystem. Access founder-focused courses, AI implementation guides, and personalized learning paths. Master AI tools and founder skills at your own pace.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "Connect Strategically",
    subtitle: "Find perfect collaborators, employees, and investors",
    description:
      "Find your perfect collaborators, future employees, and investors through our AI-powered matching system. Build relationships that matter and expand your network with high-quality connections.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 22h4a2 2 0 0 0 2-2v-4" />
        <path d="M12 12a4 4 0 0 0 0 8 4 4 0 0 0 0-8Z" />
        <path d="M8 2H4a2 2 0 0 0-2 2v4" />
        <path d="M22 8V4a2 2 0 0 0-2-2h-4" />
        <path d="M2 16v4a2 2 0 0 0 2 2h4" />
        <circle cx="12" cy="5" r="3" />
        <path d="m19 5-7 7-7-7" />
      </svg>
    ),
  },
  {
    title: "Launch Confidently",
    subtitle: "Transform your launch process with AI optimization",
    description:
      "Transform your launch process with AI-optimized marketing assets, audience targeting, and launch strategies tailored to your product. Achieve product-market fit faster with data-driven insights.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path d="M4 22v-7" />
      </svg>
    ),
  },
  {
    title: "Identify Opportunities",
    subtitle: "Easily uncover untapped areas to explore",
    description:
      "Our AI-powered market analysis tools help you identify emerging trends and untapped opportunities before your competitors. Gain insights into market gaps and expand your reach effortlessly with data-backed recommendations.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9 10 10 0 0 0 0-18Z" />
        <path d="M12 19a7 7 0 1 0 0-14" />
      </svg>
    ),
  },
  {
    title: "Build Authority",
    subtitle: "Create valuable content that resonates",
    description:
      "Our AI content creation tools help you generate high-quality, original content that establishes you as an authority in your field. Create blog posts, social media content, whitepapers, and more that inspire trust and position you as an expert.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    title: "Instant Insights",
    subtitle: "Gain immediate, actionable insights with a quick glance",
    description:
      "Our AI-powered analytics dashboard provides real-time insights into your business performance. Quickly understand what's working, what needs attention, and make data-driven decisions without getting lost in complex charts and reports.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="8" />
      </svg>
    ),
  },
  {
    title: "Accelerate Growth",
    subtitle: "Supercharge your growth with AI-powered strategies",
    description:
      "Implement AI-optimized growth strategies that drive measurable results quickly and efficiently. Our platform analyzes your unique business situation and recommends personalized tactics to accelerate your path to success.",
    icon: (
      <svg
        className="h-6 w-6 text-slate-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="container py-20 space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-4xl font-bold">
          Boost Your Strategy with Smart Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          LaunchpadAI brings together all the tools, knowledge, and connections
          you need to succeed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuresData.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            subtitle={feature.subtitle}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </section>
  );
}
