"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavbarSection() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-8 w-8 text-primary"
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
          <span className="text-xl font-bold">LaunchpadAI</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <a
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </a>
          <a
            href="#faq"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            FAQ
          </a>
          <a
            href="#testimonials"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Testimonials
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
