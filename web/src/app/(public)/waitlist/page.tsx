import { Metadata } from "next";
import Header from "@/components/waitlist/Header";
import Hero from "@/components/waitlist/Hero";
import Features from "@/components/waitlist/Features";
import HowItWorks from "@/components/waitlist/HowItWorks";
import Testimonials from "@/components/waitlist/Testimonials";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import FAQ from "@/components/waitlist/FAQ";
import Footer from "@/components/waitlist/Footer";

export const metadata: Metadata = {
  title: "LaunchpadAI - Join the Waitlist",
  description:
    "Get early access to LaunchpadAI, the platform that transforms how businesses deploy enterprise-grade AI solutions.",
};

export default function WaitlistPage() {
  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50 overflow-hidden pt-16">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <WaitlistForm />
      <FAQ />
      <Footer />
    </div>
  );
}
