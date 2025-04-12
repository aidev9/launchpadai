"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white shadow">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <svg
              className="h-8 w-8 text-indigo-600"
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
            <span className="ml-2 text-xl font-bold text-gray-800">
              LaunchpadAI
            </span>
          </div>
        </Link>
        <div>
          <Button
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => scrollToElement("waitlist")}
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </nav>
  );
}
