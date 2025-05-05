"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { TestimonialCard } from "./testimonial-card";
import Testimonial from "./testimonial-card";

const testimonialData = [
  {
    id: "tab1",
    initials: "SC",
    name: "Sarah Chen",
    title: "Founder of HealthTech Innovators",
    testimonial:
      '"LaunchpadAI cut our MVP development time in half. The prompt library alone saved us weeks of trial and error, and the connections we made through the platform led to our seed round."',
  },
  {
    id: "tab2",
    initials: "MJ",
    name: "Marcus Johnson",
    title: "CEO of FinTech Solutions",
    testimonial:
      '"As a non-technical founder, I was struggling to communicate with developers. LaunchpadAI\'s learning resources and AI tools bridged that gap and helped me become self-sufficient in building our first product."',
  },
  {
    id: "tab3",
    initials: "CS",
    name: "The Cloudsphere Team",
    title: "SaaS Platform",
    testimonial:
      '"We\'ve tried every AI tool on the market, but LaunchpadAI is the only one that truly understands the founder journey. The combination of tools, learning, and community is unmatched."',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="container py-20 space-y-12">
      <Testimonial />
    </section>
  );
}
