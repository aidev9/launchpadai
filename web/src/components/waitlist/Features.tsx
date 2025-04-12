"use client";

import AnimatedElement from "@/components/ui/animated-element";

const features = [
  {
    title: "Enterprise-Ready AI",
    description:
      "Deploy AI solutions that are secure, compliant, and ready for enterprise-scale challenges from day one.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Rapid Deployment",
    description:
      "Launch your AI initiatives in days, not months. Save time and resources with our streamlined approach.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Custom Solutions",
    description:
      "Tailor AI capabilities to your specific business needs. No one-size-fits-all approach.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
        />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section className="py-16 md:py-24 bg-white" id="features">
      <div className="container mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Why Enterprises Choose LaunchpadAI
          </h2>
        </AnimatedElement>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <AnimatedElement key={feature.title} delay={index * 200}>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
