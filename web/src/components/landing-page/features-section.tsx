"use client";

import { FeatureCard } from "./feature-card";
import AnimatedElement from "@/components/ui/animated-element";
import {
  IconBook,
  IconBrain,
  IconFlag,
  IconNetwork,
  IconRocket,
  IconSchool,
  IconTarget,
  IconTool,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const featuresData = [
  {
    title: "Build Smarter",
    subtitle: "Create products 10x faster with AI tools at your fingertips",
    description:
      "Access pre-built prompt libraries and AI tools that help you create products faster. From coding assistance to design generation, LaunchpadAI amplifies your building capabilities and helps you save 20+ hours per week on development tasks.",
    icon: <IconTool />,
    imageUrl:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
  {
    title: "Learn Continuously",
    subtitle: "Exclusive courses, tutorials and AI implementation guides",
    description:
      "Never stop growing with our exclusive learning ecosystem. Access founder-focused courses, AI implementation guides, and personalized learning paths. Master AI tools and founder skills at your own pace.",
    icon: <IconBook />,
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
  },
  {
    title: "Connect Strategically",
    subtitle: "Find perfect collaborators, employees, and investors",
    description:
      "Find your perfect collaborators, future employees, and investors through our AI-powered matching system. Build relationships that matter and expand your network with high-quality connections.",
    icon: <IconNetwork />,
    imageUrl:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
  {
    title: "Launch Confidently",
    subtitle: "Transform your launch process with AI optimization",
    description:
      "Transform your launch process with AI-optimized marketing assets, audience targeting, and launch strategies tailored to your product. Achieve product-market fit faster with data-driven insights.",
    icon: <IconFlag />,
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80",
  },
  {
    title: "Identify Opportunities",
    subtitle: "Find opportunities and uncover untapped areas to explore",
    description:
      "Our AI-powered market analysis tools help you identify emerging trends and untapped opportunities before your competitors. Gain insights into market gaps and expand your reach effortlessly with data-backed recommendations.",
    icon: <IconTarget />,
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1415&q=80",
  },
  {
    title: "Build Authority",
    subtitle: "Create valuable content that resonates with your audience",
    description:
      "Our AI content creation tools help you generate high-quality, original content that establishes you as an authority in your field. Create blog posts, social media content, whitepapers, and more that inspire trust and position you as an expert.",
    icon: <IconSchool />,
    imageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
  {
    title: "Instant Insights",
    subtitle: "Gain immediate, actionable insights with a quick glance",
    description:
      "Our AI-powered analytics dashboard provides real-time insights into your business performance. Quickly understand what's working, what needs attention, and make data-driven decisions without getting lost in complex charts and reports.",
    icon: <IconBrain />,
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
  {
    title: "Accelerate Growth",
    subtitle: "Supercharge your growth with AI-powered strategies",
    description:
      "Implement AI-optimized growth strategies that drive measurable results quickly and efficiently. Our platform analyzes your unique business situation and recommends personalized tactics to accelerate your path to success.",
    icon: <IconRocket />,
    imageUrl:
      "https://images.unsplash.com/photo-1533750349088-cd871a92f312?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="container py-20 space-y-16 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-40 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <AnimatedElement className="text-center space-y-4">
        <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Boost Your Strategy with Smart Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          LaunchpadAI brings together all the tools, knowledge, and connections
          you need to succeed.
        </p>
      </AnimatedElement>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuresData.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            subtitle={feature.subtitle}
            description={feature.description}
            icon={feature.icon}
            imageUrl={feature.imageUrl}
          />
        ))}
      </div>
    </section>
  );
}
