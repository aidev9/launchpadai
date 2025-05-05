"use client";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="container py-20">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 md:p-12 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to Supercharge Your Startup?
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Join thousands of founders building faster and smarter with
          LaunchpadAI.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button size="lg" className="text-lg px-8">
            Start Building Today
          </Button>
          <Button size="lg" variant="outline" className="text-lg">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
