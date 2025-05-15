"use client";

import { NavbarSection } from "@/components/landing-page/navbar-section";
import { HeroSection } from "@/components/landing-page/hero-section";
import { FeaturesSection } from "@/components/landing-page/features-section";
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section";
import { FAQSection } from "@/components/landing-page/faq-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";
import { PricingSection } from "@/components/landing-page/pricing-section";
import { CTASection } from "@/components/landing-page/cta-section";
import { FooterSection } from "@/components/landing-page/footer-section";
import { LayoutWrapper } from "@/components/landing-page/layout-wrapper";
import ChatWidget from "@/components/ui/chat-widget";

// Force dynamic rendering since the page uses client components
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <LayoutWrapper>
      <div className="flex flex-col min-h-screen bg-background">
        <NavbarSection />

        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <FAQSection />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
        </main>

        <FooterSection />

        {/* Chat Widget */}
        <ChatWidget />
      </div>
    </LayoutWrapper>
  );
}
