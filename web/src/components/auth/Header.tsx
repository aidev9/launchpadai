"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthHeader() {
  const pathname = usePathname();

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
        <div className="space-x-4">
          {pathname !== "/auth/signin" && (
            <Button asChild variant="ghost">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}

          {pathname !== "/auth/signup" && (
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
