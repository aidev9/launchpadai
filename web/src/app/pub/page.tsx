"use client";

import { NavbarSection } from "@/components/landing-page/navbar-section";
import { HeroSection } from "@/components/landing-page/hero-section";
import { FeaturesSection } from "@/components/landing-page/features-section";
import { FAQSection } from "@/components/landing-page/faq-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";
import { PricingSection } from "@/components/landing-page/pricing-section";
import { CTASection } from "@/components/landing-page/cta-section";
import { FooterSection } from "@/components/landing-page/footer-section";

// Force dynamic rendering since the page uses client components
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavbarSection />

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FAQSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}
