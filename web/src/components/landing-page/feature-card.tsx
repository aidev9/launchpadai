"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

export function FeatureCard({
  title,
  subtitle,
  description,
  icon,
}: FeatureCardProps) {
  return (
    <Card className="border rounded-lg overflow-hidden group hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="desc" className="border-b-0">
            <AccordionTrigger className="py-1 text-sm font-normal text-muted-foreground hover:no-underline transition-all duration-300 justify-between text-left">
              <span>{subtitle}</span>
            </AccordionTrigger>
            <AccordionContent className="transition-all duration-300 ease-in-out">
              <p className="text-sm text-muted-foreground mb-2">
                {description}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="h-32 bg-slate-100 flex items-center justify-center">
        <div className="text-4xl font-semibold text-slate-400">{title}</div>
      </div>
    </Card>
  );
}
