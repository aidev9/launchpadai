"use client";

import AnimatedElement from "@/components/ui/animated-element";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Connect",
      description:
        "Securely connect your enterprise data sources and applications.",
    },
    {
      number: 2,
      title: "Configure",
      description:
        "Use our no-code interface to design your AI workflow and objectives.",
    },
    {
      number: 3,
      title: "Customize",
      description:
        "Fine-tune your models and interfaces to match your brand and requirements.",
    },
    {
      number: 4,
      title: "Launch",
      description:
        "Deploy your enterprise AI solution to production with one click.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How LaunchpadAI Works
          </h2>
        </AnimatedElement>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <AnimatedElement
              key={step.number}
              className="text-center"
              delay={step.number * 200}
            >
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 font-bold text-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
