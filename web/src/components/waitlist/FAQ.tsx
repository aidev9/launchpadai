"use client";

import { useState } from "react";
import AnimatedElement from "@/components/ui/animated-element";

export default function FAQ() {
  const faqItems = [
    {
      question: "When will LaunchpadAI be available?",
      answer:
        "We're planning to launch in Q3 2025. Waitlist members will be given early access in phases, starting with our Enterprise partners.",
    },
    {
      question: "What types of AI solutions can I build with LaunchpadAI?",
      answer:
        "LaunchpadAI supports a wide range of AI applications including document processing, predictive analytics, natural language processing, computer vision solutions, and custom AI workflows tailored to your specific business needs.",
    },
    {
      question: "Do I need AI expertise to use LaunchpadAI?",
      answer:
        "No technical AI expertise is required. Our platform is designed with a no-code interface that allows business users to configure and deploy AI solutions. For those who want deeper customization, we also offer developer options.",
    },
    {
      question: "How is LaunchpadAI different from other AI platforms?",
      answer:
        "LaunchpadAI is specifically designed for enterprise requirements with built-in security, compliance, and integration capabilities. Our platform focuses on accelerating time-to-value for AI initiatives while maintaining enterprise governance standards.",
    },
    {
      question: "What support will be available during implementation?",
      answer:
        "All customers receive dedicated implementation support from our AI specialists. Enterprise customers receive a dedicated solution architect to guide your team through the entire process.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>
        </AnimatedElement>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <AnimatedElement
              key={index}
              className="bg-white rounded-lg overflow-hidden"
              delay={index * 200}
            >
              <button
                className="w-full text-left px-6 py-5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-xl font-bold">{item.question}</h3>
                <div className="text-2xl text-indigo-600 transform transition-transform duration-200 ml-4">
                  {openIndex === index ? "−" : "+"}
                </div>
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 py-5" : "max-h-0 py-0"
                }`}
              >
                <p className="text-gray-600">{item.answer}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
