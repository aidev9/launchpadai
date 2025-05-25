"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { firebaseErrors } from "@/lib/firebase/client/FirebaseErrors";
import { createErrorLogInput } from "@/lib/utils/error-utils";

interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  component?: string; // Component name where error occurred
  action?: string; // Action being performed when error occurred
  metadata?: Record<string, any>; // Additional context data
}

const DIGIT_COUNT = 8;

function getRandomDigits() {
  return Array.from({ length: DIGIT_COUNT }, () =>
    Math.floor(Math.random() * 10)
  );
}

const AnimatedErrorCode = () => {
  const [digits, setDigits] = useState(getRandomDigits());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setDigits(getRandomDigits());
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex space-x-1 font-mono text-lg text-red-400">
        {Array(DIGIT_COUNT)
          .fill(0)
          .map((_, idx) => (
            <span key={idx}>0</span>
          ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-1 font-mono text-lg text-red-400">
      {digits.map((digit, idx) => (
        <motion.span
          key={idx + "-" + digit}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {digit}
        </motion.span>
      ))}
    </div>
  );
};

const RocketErrorIcon = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="mb-4"
  >
    <svg
      width="80"
      height="80"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Rocket body */}
      <motion.path
        d="M50 10 L60 70 L50 75 L40 70 Z"
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Rocket fins */}
      <motion.path
        d="M35 60 L40 70 L35 75 Z"
        fill="#dc2626"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.path
        d="M65 60 L60 70 L65 75 Z"
        fill="#dc2626"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />

      {/* Rocket window */}
      <motion.circle
        cx="50"
        cy="35"
        r="8"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />

      {/* Sad face in window */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      >
        <circle cx="47" cy="32" r="1.5" fill="#1d4ed8" />
        <circle cx="53" cy="32" r="1.5" fill="#1d4ed8" />
        <path
          d="M46 38 Q50 35 54 38"
          stroke="#1d4ed8"
          strokeWidth="1.5"
          fill="none"
        />
      </motion.g>

      {/* Smoke/exhaust */}
      <motion.g
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <circle cx="45" cy="85" r="3" fill="#9ca3af" opacity="0.6" />
        <circle cx="55" cy="88" r="2.5" fill="#9ca3af" opacity="0.4" />
        <circle cx="50" cy="92" r="2" fill="#9ca3af" opacity="0.3" />
      </motion.g>

      {/* Floating error symbols */}
      <motion.text
        x="25"
        y="25"
        fontSize="12"
        fill="#ef4444"
        initial={{ opacity: 0, rotate: -45 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        !
      </motion.text>
      <motion.text
        x="75"
        y="40"
        fontSize="10"
        fill="#ef4444"
        initial={{ opacity: 0, rotate: 45 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
      >
        ?
      </motion.text>
    </svg>
  </motion.div>
);

export function ErrorDisplay({
  error,
  title = "Oops! The launch codes got mixed up",
  message = "Our rocket hit a small bump in space. Don't worry, mission control is on it!",
  onRetry,
  retryText = "Launch Again",
  className = "",
  component,
  action,
  metadata,
}: ErrorDisplayProps) {
  // Log the error to Firebase and console
  useEffect(() => {
    if (error) {
      // Log to console for immediate debugging
      console.log("Error details:", error);

      // Log to Firebase for persistent tracking
      const logErrorToFirebase = async () => {
        try {
          const errorLogInput = createErrorLogInput(error, {
            component,
            action,
            metadata,
          });

          const result = await firebaseErrors.createErrorLog(errorLogInput);

          if (result.success) {
            console.log("Error logged to Firebase with ID:", result.id);
          } else {
            console.warn("Failed to log error to Firebase:", result.error);
          }
        } catch (firebaseError) {
          // Don't create an infinite loop if Firebase logging fails
          console.warn("Error logging to Firebase failed:", firebaseError);
        }
      };

      logErrorToFirebase();
    }
  }, [error, component, action, metadata]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}
    >
      <RocketErrorIcon />

      <div className="space-y-2">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-foreground"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground max-w-md"
        >
          {message}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center space-y-3"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Error code:</span>
          <AnimatedErrorCode />
        </div>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-4"
            data-testid="error-retry-button"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryText}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
