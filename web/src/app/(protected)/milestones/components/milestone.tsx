"use client";

import { motion } from "framer-motion";
import { CheckIcon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MilestoneProps, StepStatus } from "../types";
import { cn } from "@/lib/utils";

export function Milestone({ step, alignLeft }: MilestoneProps) {
  const getStatusColor = (status: StepStatus): string => {
    switch (status) {
      case StepStatus.Completed:
        return "bg-green-500 text-white border-green-600";
      case StepStatus.Current:
        return "bg-blue-500 text-white border-blue-600";
      case StepStatus.Upcoming:
        return "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div
      className={`flex items-center mb-12 ${
        alignLeft ? "flex-row" : "flex-row-reverse"
      }`}
    >
      {/* Content */}
      <motion.div
        className={`w-[45%] ${alignLeft ? "text-right pr-8" : "text-left pl-8"}`}
        initial={{ opacity: 0, x: alignLeft ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className={cn(
            "overflow-hidden shadow-md border-l-4",
            step.status === StepStatus.Completed
              ? "border-l-green-500"
              : step.status === StepStatus.Current
                ? "border-l-blue-500"
                : "border-l-gray-300 dark:border-l-gray-600"
          )}
        >
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{step.duration}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Circle Indicator */}
      <div className="z-10 flex items-center justify-center">
        <motion.div
          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${getStatusColor(
            step.status
          )}`}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {step.status === StepStatus.Completed && (
            <CheckIcon className="h-4 w-4" />
          )}
          {step.status === StepStatus.Current && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </motion.div>
      </div>

      {/* Spacer */}
      <div className={`w-[45%] ${alignLeft ? "pl-8" : "pr-8"}`}></div>
    </div>
  );
}
