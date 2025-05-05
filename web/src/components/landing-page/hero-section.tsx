"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export function HeroSection() {
  return (
    <section className="container pt-16 md:pt-18">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeIn} className="space-y-6">
          <Badge className="text-sm" variant="secondary">
            AI-Powered Founder Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Launch Your Startup Faster with AI Superpowers
          </h1>
          <p className="text-xl text-muted-foreground">
            LaunchpadAI helps founders build, learn, and connect—transforming
            ideas into market-ready products in record time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg px-8">
              Start Building Today
            </Button>
            <Button size="lg" variant="outline" className="text-lg group">
              See How It Works
              <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by 1,000+ founders from YCombinator, Techstars, and 500
            Startups
          </p>
        </motion.div>
        <motion.div
          variants={fadeIn}
          className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden"
        >
          <Image
            src="/images/founder-laptop1.webp"
            alt="Hero Image"
            width={700}
            height={500}
            className="rounded-lg overflow-hidden"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
