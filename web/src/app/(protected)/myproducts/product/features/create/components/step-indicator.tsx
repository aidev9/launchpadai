"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  stepNames,
  onStepClick,
}: StepIndicatorProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="flex items-center justify-between mb-4 max-w-[70%]">
      <div className="flex items-center w-full">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={`step-group-${index + 1}`}
            className="relative flex-1 flex flex-col items-center"
          >
            {/* Line connecting steps */}
            {index < totalSteps - 1 && (
              <div
                className={`absolute top-5 left-1/2 w-full h-0.5 ${
                  currentStep > index + 1 ? "bg-primary" : "bg-muted"
                }`}
              />
            )}

            {/* Step circle */}
            <motion.div
              className={`flex items-center justify-center h-10 w-10 rounded-full cursor-pointer z-10 ${
                currentStep >= index + 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
              whileHover={{ scale: 1.1 }}
              onClick={() => onStepClick(index + 1)}
              onMouseEnter={() => setHoveredStep(index + 1)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {currentStep > index + 1 ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </motion.div>

            {/* Step name below step */}
            <div className="mt-4 text-xs text-center">{stepNames[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
