"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function FooterSection() {
  return (
    <footer className="bg-muted/30 border-t py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
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
            <p className="text-sm text-muted-foreground mb-4">
              Empowering founders with AI superpowers
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Tutorials
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  API Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="21.17" y1="8" x2="12" y2="8"></line>
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 8-6 4 6 4V8Z"></path>
                  <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
                </svg>
              </a>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                Subscribe to our newsletter
              </h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3 py-2 bg-background border rounded-md text-sm flex-1"
                />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 LaunchpadAI. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
