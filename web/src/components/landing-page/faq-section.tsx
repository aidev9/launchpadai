"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@radix-ui/react-icons";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";

const faq = [
  {
    question: "What subscription plans does LaunchpadAI offer?",
    answer:
      "LaunchpadAI offers four subscription tiers: Free ($0/mo), Explorer ($29/mo), Builder ($59/mo - our recommended plan), and Accelerator ($99/mo). Each tier provides increasing access to AI tools, resources, and personalized support. The Free plan lets you explore basic features, Explorer is great for solo founders, Builder offers the best value for early-stage startups, and Accelerator includes advanced features for growing companies.",
  },
  {
    question: "Which AI models does LaunchpadAI use?",
    answer:
      "LaunchpadAI leverages state-of-the-art AI models including GPT-4, Claude 3, and proprietary models specifically trained for startup development tasks. Our platform combines multiple specialized models for market research, code generation, design assistance, and growth strategy. We regularly update our AI capabilities to incorporate the latest advancements in artificial intelligence.",
  },
  {
    question: "What types of startups does LaunchpadAI support?",
    answer:
      "LaunchpadAI supports a wide range of startups across industries including SaaS, fintech, healthtech, e-commerce, AI/ML, consumer apps, and more. Our platform is particularly effective for tech-enabled businesses, but our tools and resources are adaptable to various business models. Whether you're building a mobile app, web platform, or AI service, our tools can accelerate your journey from concept to launch.",
  },
  {
    question: "Does LaunchpadAI take equity or a percentage of my startup?",
    answer:
      "No, LaunchpadAI does not take any equity or percentage of your startup. We operate on a straightforward subscription model with no hidden fees or equity requirements. You maintain 100% ownership of your business and all intellectual property created using our platform. Our goal is to be a tool that helps you succeed, not a stakeholder in your business.",
  },
  {
    question: "What is your pricing structure and are there any hidden fees?",
    answer:
      "Our pricing is transparent with no hidden fees. We offer a Free plan ($0/mo), Explorer ($29/mo), Builder ($59/mo - recommended), and Accelerator ($99/mo). The Accelerator plan includes basic tools, limited prompt library access, and community forum access. All paid plans include core AI tools, with higher tiers offering more advanced features, increased usage limits, and priority support. You can upgrade, downgrade, or cancel at any time. We also offer annual billing with a 20% discount compared to monthly payments.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "You can cancel your LaunchpadAI subscription at any time with no cancellation fees. When you cancel, you'll maintain access to the platform until the end of your current billing period. We don't offer prorated refunds for partial months, but you're welcome to use all features until your subscription period ends. Your data remains accessible for 30 days after cancellation, after which it may be deleted from our systems.",
  },
  {
    question: "Can I use my own API keys with LaunchpadAI?",
    answer:
      "Yes, LaunchpadAI supports using your own API keys for various services including OpenAI, Anthropic, and other AI providers. This gives you more control over your usage and can help manage costs if you already have existing relationships with these providers. Using your own API keys also ensures that all generated content belongs entirely to you and operates under your agreements with those providers.",
  },
  {
    question: "How does LaunchpadAI help with technical implementation?",
    answer:
      "LaunchpadAI provides comprehensive technical support through AI-powered code generation, architecture recommendations, and integration assistance. Our platform includes pre-built components, templates, and frameworks that accelerate development. For Pro and Enterprise users, we offer technical consulting sessions with experienced developers. We also provide extensive documentation, tutorials, and a community forum where you can get help from other founders and our technical team.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-16">
      <div
        id="faq"
        className="w-full max-w-screen-xl mx-auto py-8 xs:py-16 px-6"
      >
        <h2 className="md:text-center text-3xl xs:text-4xl md:text-5xl !leading-[1.15] font-bold tracking-tighter">
          Frequently Asked Questions
        </h2>
        <p className="mt-1.5 md:text-center xs:text-lg text-muted-foreground">
          Everything you need to know about our AI-powered startup accelerator
          platform.
        </p>

        <div className="min-h-[550px] md:min-h-[320px] xl:min-h-[300px]">
          <Accordion
            type="single"
            collapsible
            className="mt-8 space-y-4 md:columns-2 gap-4"
          >
            {faq.map(({ question, answer }, index) => (
              <AccordionItem
                key={question}
                value={`question-${index}`}
                className="bg-accent py-1 px-4 rounded-xl border-none !mt-0 !mb-4 break-inside-avoid"
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger
                    className={cn(
                      "flex flex-1 items-center justify-between py-4 font-semibold tracking-tight transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
                      "text-start text-lg"
                    )}
                  >
                    {question}
                    <PlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="text-[15px] overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
