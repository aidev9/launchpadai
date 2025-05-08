"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedElement from "@/components/ui/animated-element";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
}

export function FeatureCard({
  title,
  subtitle,
  description,
  icon,
  imageUrl,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedElement animation="fade-up">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="border rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer">
          <div className="p-5 flex-grow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 flex items-center justify-center rounded-lg text-primary">
                {icon}
              </div>
              <h3 className="text-md font-bold">{title}</h3>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="desc" className="border-b-0">
                <AccordionTrigger className="py-1 text-xs font-normal text-muted-foreground hover:no-underline transition-all duration-300 justify-between text-left group">
                  <span className="relative">{subtitle}</span>
                </AccordionTrigger>
                <AccordionContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      {description}
                    </p>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="relative h-48 overflow-hidden">
            {imageUrl ? (
              <>
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity duration-300 ${isHovered ? "opacity-70" : "opacity-40"}`}
                />
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <motion.span
                    className="text-white font-semibold text-lg"
                    animate={{
                      y: isHovered ? 0 : 10,
                      opacity: isHovered ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {title}
                  </motion.span>
                </div>
              </>
            ) : (
              <div className="h-full bg-slate-100 flex items-center justify-center">
                <div className="text-4xl font-semibold text-slate-400">
                  {title}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AnimatedElement>
  );
}
