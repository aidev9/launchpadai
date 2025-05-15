"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { smoothScrollToSection } from "@/utils/scroll-utils";

export function NavbarSection() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Update navbar style based on scroll position
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Update active section based on scroll position
      const sections = [
        "hero",
        "features",
        "how-it-works",
        "faq",
        "testimonials",
        "pricing",
      ];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    smoothScrollToSection(sectionId);
  };

  return (
    <motion.header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur transition-all duration-300 ${
        scrolled
          ? "bg-background/95 shadow-sm supports-[backdrop-filter]:bg-background/60"
          : "bg-background/50 supports-[backdrop-filter]:bg-background/20"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="flex items-center gap-2 justify-start">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>

            <span className="text-md font-semibold">LaunchpadAI</span>
          </div>
        </Link>
        <nav className="hidden md:flex gap-6">
          {[
            { id: "features", label: "Features" },
            { id: "how-it-works", label: "How It Works" },
            { id: "faq", label: "FAQ" },
            { id: "testimonials", label: "Testimonials" },
            { id: "pricing", label: "Pricing" },
          ].map((item) => (
            <motion.a
              key={item.id}
              href={`#${item.id}`}
              onClick={scrollToSection(item.id)}
              className={`text-sm font-medium relative px-1 py-2 transition-colors ${
                activeSection === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.label}
              {activeSection === item.id && (
                <motion.span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="activeSection"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button
              variant="ghost"
              size="default"
              className="hover:bg-primary/5"
            >
              Sign In
            </Button>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="default"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollToSection("pricing");
              }}
            >
              Sign Up
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
