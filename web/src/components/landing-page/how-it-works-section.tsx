"use client";

import { motion } from "framer-motion";
import AnimatedElement from "@/components/ui/animated-element";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { IconDelta, IconPaint, IconBrush } from "@tabler/icons-react";

// Phase colors from the phase-filter component
const getPhaseColor = (phase: string) => {
  switch (phase) {
    case "Discover":
      return "bg-blue-500/10 text-blue-500";
    case "Validate":
      return "bg-purple-500/10 text-purple-500";
    case "Design":
      return "bg-pink-500/10 text-pink-500";
    case "Build":
      return "bg-amber-500/10 text-amber-500";
    case "Secure":
      return "bg-red-500/10 text-red-500";
    case "Launch":
      return "bg-green-500/10 text-green-500";
    case "Grow":
      return "bg-orange-500/10 text-orange-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
};

const getPhaseRingColor = (phase: string) => {
  switch (phase) {
    case "Discover":
      return "ring-blue-500";
    case "Validate":
      return "ring-purple-500";
    case "Design":
      return "ring-pink-500";
    case "Build":
      return "ring-amber-500";
    case "Secure":
      return "ring-red-500";
    case "Launch":
      return "ring-green-500";
    case "Grow":
      return "ring-orange-500";
    default:
      return "ring-gray-500";
  }
};

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Use the power of LaunchpadAI to identify market opportunities and validate your startup idea. Creating a marketing strategy has never been easier.",
    benefits: [
      "Market gap analysis",
      "Competitor insights",
      "Trend forecasting",
      "Customer pain points",
      "Industry research",
      "TAM/SAM/SOM analysis",
      "Opportunity validation",
      "Market entry strategy",
      "Pricing research",
      "Customer segmentation",
      "SWOT analysis",
    ],
    icon: (
      <svg
        className="h-6 w-6"
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
    color: "blue",
    imageUrl:
      "https://images.pexels.com/photos/11813187/pexels-photo-11813187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "02",
    title: "Validate",
    description:
      "Need a customer validation questionnaire? Use LaunchpadAI to test your MVP and gather feedback. Our platform helps you refine your product-market fit.",
    benefits: [
      "User feedback analysis",
      "MVP testing",
      "A/B testing",
      "Customer interviews",
      "Value proposition testing",
      "Pricing model validation",
      "Feature prioritization",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5l10 -10" />
      </svg>
    ),
    color: "purple",
    imageUrl:
      "https://images.pexels.com/photos/18485666/pexels-photo-18485666/free-photo-of-smart-home-devices.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "03",
    title: "Design",
    description:
      "Tap into the power of the LLMs to create stunning designs and prototypes. Our platform helps you build a cohesive design system.",
    benefits: [
      "UI/UX optimization",
      "Brand identity creation",
      "Wireframing",
      "Prototyping",
      "Design system creation",
      "User journey mapping",
      "Accessibility compliance",
      "Visual language development",
    ],
    icon: (
      <svg
        className="h-6 w-6"
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
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    color: "pink",
    imageUrl:
      "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "04",
    title: "Build",
    description:
      "This is where the magic happens. Use LaunchpadAI to build your product faster and more efficiently. Our platform provides you with the tools you need to succeed.",
    benefits: [
      "Vibe coding",
      "Code generation",
      "Component libraries",
      "Prompt engineering",
      "Architecture optimization",
      "API development",
      "Database design",
      "CI/CD implementation",
      "Testing automation",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M12 12h.01" />
        <path d="M17 12h.01" />
        <path d="M7 12h.01" />
      </svg>
    ),
    color: "amber",
    imageUrl:
      "https://images.pexels.com/photos/1181359/pexels-photo-1181359.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "05",
    title: "Secure",
    description:
      "Add ironclad security to your product with LaunchpadAI. Our platform helps you implement best practices and ensure compliance. Conduct security audits and penetration tests within minutes with automatic prompt generation.",
    benefits: [
      "Vulnerability detection",
      "Security best practices",
      "Black-box testing",
      "Penetration testing",
      "Compliance automation",
      "Data encryption",
      "Authentication systems",
      "Penetration testing",
      "Security auditing",
      "GDPR compliance",
      "Threat monitoring",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "red",
    imageUrl:
      "https://images.pexels.com/photos/2882638/pexels-photo-2882638.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "06",
    title: "Launch",
    description:
      "Time to party! Use LaunchpadAI to automate your launch process and ensure a successful go-to-market strategy. Our platform helps you create a buzz and reach your target audience.",
    benefits: [
      "Go-to-market planning",
      "Launch automation",
      "PR strategy",
      "Social media campaigns",
      "Product hunt optimization",
      "SEO implementation",
      "Analytics setup",
      "Conversion tracking",
    ],
    icon: (
      <svg
        className="h-6 w-6"
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
    color: "green",
    imageUrl:
      "https://images.pexels.com/photos/5550910/pexels-photo-5550910.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    number: "07",
    title: "Grow",
    description:
      "Scale your startup with LaunchpadAI. Our platform helps you optimize your growth strategy and reach new heights. Use our tools to analyze your performance and make data-driven decisions.",
    benefits: [
      "Customer retention",
      "Revenue optimization",
      "Funnel optimization",
      "Churn reduction",
      "Referral programs",
      "Scaling infrastructure",
      "Investor relations",
      "Strategic partnerships",
    ],
    icon: (
      <svg
        className="h-6 w-6"
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
    color: "orange",
    imageUrl:
      "https://images.pexels.com/photos/7062/man-people-space-desk.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-40 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <AnimatedElement className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-1 text-sm bg-primary/10 text-primary border-none">
            7-Phase Startup Journey
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            How LaunchpadAI Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform guides you through every phase of your
            startup journey
          </p>
        </AnimatedElement>

        {/* Phase timeline */}
        <div className="relative mb-20 overflow-x-auto py-4 px-2">
          <div className="relative left-0 right-0 bottom-0 h-1 transform bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-18" />

          <div className="flex justify-between relative z-10 min-w-[700px] px-4 md:px-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="flex flex-col items-center cursor-pointer"
                whileHover={{ y: -5 }}
                onClick={() => setActiveStep(index)}
                onMouseEnter={() => setActiveStep(index)}
              >
                <motion.div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 border-2 ${
                    activeStep === index
                      ? `${getPhaseRingColor(step.title)} ring-2 ${getPhaseColor(step.title)}`
                      : "border-primary/20 bg-background"
                  } transition-all duration-300`}
                  animate={
                    activeStep === index ? { scale: [1, 1.1, 1] } : { scale: 1 }
                  }
                  transition={{
                    duration: 0.5,
                    repeat: activeStep === index ? Infinity : 0,
                    repeatType: "reverse",
                  }}
                  onClick={() => {
                    // The parent div's onClick handles setActiveStep(index).
                    // This onClick handler is specifically for the scroll action.
                    const targetId = `step-content-${step.title.toLowerCase().replace(/\s+/g, "-")}`;
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                      targetElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  <span className="font-bold">{step.number}</span>
                </motion.div>
                <span
                  className={`font-medium text-lg ${activeStep === index ? "text-primary" : ""}`}
                >
                  <Badge className="text-sm" variant="secondary">
                    {step.title}
                  </Badge>
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="mt-16 relative px-8">
          {/* Continuous vertical timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-300 z-0" />

          {steps.map((step, index) => (
            <AnimatedElement
              key={step.number}
              className="relative z-10 mb-16 last:mb-0"
              delay={index * 100}
            >
              <div className="flex items-center justify-center mb-6">
                {/* Timeline center icon - solid background */}
                <div
                  className={`w-14 h-14 rounded-full ${
                    step.title === "Design"
                      ? "bg-pink-500"
                      : getPhaseColor(step.title)
                          .split(" ")[0]
                          .replace("/10", "")
                  } flex items-center justify-center z-10 border-4 border-background shadow-lg`}
                  id={`step-content-${step.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-white">{step.icon}</div>
                </div>
              </div>

              <div
                className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center`}
              >
                {/* Content side with 32px padding */}
                <div className="w-full md:w-1/2 space-y-4 px-8">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full ${getPhaseColor(step.title).replace("/10", "")} text-white font-bold`}
                    >
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {step.description}
                  </p>

                  {/* Feature highlights - Two columns of four */}
                  <div className="pt-4 grid grid-cols-2 gap-3">
                    {step.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full ${getPhaseColor(step.title).replace("text-", "bg-").replace("/10", "/")} flex items-center justify-center`}
                        >
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image side with proper padding */}
                <div className="w-full md:w-1/2 px-8">
                  <motion.div
                    className="relative h-[300px] rounded-xl overflow-hidden shadow-lg"
                    whileHover={{
                      scale: 1.03,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {/* Fixed gradient overlay with proper color application */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr z-10 rounded-xl ${
                        step.color === "blue"
                          ? "from-blue-500/20"
                          : step.color === "purple"
                            ? "from-purple-500/20"
                            : step.color === "pink"
                              ? "from-pink-500/20"
                              : step.color === "amber"
                                ? "from-amber-500/20"
                                : step.color === "red"
                                  ? "from-red-500/20"
                                  : step.color === "green"
                                    ? "from-green-500/20"
                                    : step.color === "orange"
                                      ? "from-orange-500/20"
                                      : "from-gray-500/20"
                      } to-transparent`}
                    />
                    <Image
                      src={step.imageUrl}
                      alt={step.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
