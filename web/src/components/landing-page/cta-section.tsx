"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import AnimatedElement from "@/components/ui/animated-element";
import { useState } from "react";

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="container py-20 relative">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <AnimatedElement>
        <motion.div
          className="bg-gradient-to-br from-background via-background to-primary/5 border border-primary/20 rounded-xl overflow-hidden shadow-lg relative"
          whileHover={{
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            scale: 1.01,
            transition: { duration: 0.3 },
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
          <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-primary/10 blur-xl" />
          <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-secondary/10 blur-xl" />

          <div className="p-8 md:p-16 text-center space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="px-4 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4 inline-block">
                LIMITED TIME OFFER
              </span>
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 py-4">
                Ready to Supercharge Your Startup?
              </h2>
            </motion.div>

            <motion.p
              className="text-lg text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Don't wait, the prices will go up soon. Join today and start
              building faster and smarter with LaunchpadAI. Choose the annual
              plan and get a complimentary AI strategy consultation.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Button
                size="lg"
                className="text-lg px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary group relative overflow-hidden"
                onClick={() => {
                  const pricingSection = document.getElementById("pricing");
                  if (pricingSection) {
                    pricingSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                <span className="relative z-10 flex items-center">
                  Start Building Today
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.span
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: isHovered ? "100%" : "-100%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg group"
                onClick={() => {
                  const howItWorksSection =
                    document.getElementById("how-it-works");
                  if (howItWorksSection) {
                    howItWorksSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                See How It Works
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="pt-8 flex flex-col items-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-muted-foreground mb-2">
                Trusted by founders from
              </p>
              <div className="flex items-center justify-center gap-6 opacity-70">
                <div className="text-sm font-bold">YCombinator</div>
                <div className="h-4 w-px bg-muted-foreground/30" />
                <div className="text-sm font-bold">Techstars</div>
                <div className="h-4 w-px bg-muted-foreground/30" />
                <div className="text-sm font-bold">500 Startups</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatedElement>

      {/* Floating action button */}
      <div className="fixed bottom-8 left-8 z-50 md:block hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 1,
          }}
        >
          <Button
            className="rounded-full w-14 h-14 bg-primary shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowRightIcon className="h-6 w-6 rotate-[-90deg]" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
