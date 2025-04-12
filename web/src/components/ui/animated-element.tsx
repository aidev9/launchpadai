"use client";

import { ReactNode } from "react";
import useInView from "@/hooks/useInView";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function in case utils.ts is not imported properly
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnimatedElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  animation?: "fade-up" | "fade-in";
}

export default function AnimatedElement({
  children,
  className = "",
  delay = 0,
  duration = 600,
  threshold = 0.05,
  rootMargin = "0px",
  animation = "fade-up",
}: AnimatedElementProps) {
  const { ref, isInView } = useInView({ threshold, rootMargin });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView
          ? "translateY(0)"
          : animation === "fade-up"
          ? "translateY(20px)"
          : "translateY(0)",
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
