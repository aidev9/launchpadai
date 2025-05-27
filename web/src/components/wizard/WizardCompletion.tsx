import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  RocketIcon,
  BrainIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "lucide-react";

type WizardCompletionProps = {
  totalXp: number;
};

const COMPLETION_BENEFITS = [
  {
    title: "Product Blueprint Created",
    description:
      "You've successfully defined your product with comprehensive business and technical details.",
    icon: <CheckCircleIcon className="h-12 w-12 text-green-500" />,
  },
  {
    title: "AI-Ready Context",
    description:
      "Your product information is now optimized for AI generation, ensuring higher quality results.",
    icon: <BrainIcon className="h-12 w-12 text-blue-500" />,
  },
  {
    title: "Feature Foundation",
    description:
      "All your features, rules, and requirements are documented and ready for development.",
    icon: <SparklesIcon className="h-12 w-12 text-purple-500" />,
  },
  {
    title: "Ready to Build",
    description:
      "Use the product builder to create prompts, assets, and code based on your blueprint.",
    icon: <RocketIcon className="h-12 w-12 text-amber-500" />,
  },
];

export default function WizardCompletion({ totalXp }: WizardCompletionProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Automatically hide confetti after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex(
        (prevIndex) => (prevIndex + 1) % COMPLETION_BENEFITS.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full bg-gradient-to-b from-green-50 to-emerald-100">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={400}
          gravity={0.3}
          style={{
            position: "fixed",
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        />
      )}

      <div className="max-w-4xl w-full mx-auto space-y-8 px-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-4xl font-bold text-gray-900"
            data-testid="completion-title"
          >
            🎉 Amazing Work!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            data-testid="completion-message"
          >
            You've successfully completed the wizard and created your product
            blueprint!
          </motion.p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 rounded-full text-amber-800 font-semibold"
            data-testid="completion-xp"
          >
            <span className="text-2xl">🏆</span>
            <span>Total XP Earned: {totalXp}</span>
          </motion.div>
        </div>

        {/* Benefits Carousel */}
        <div className="relative mt-12">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCardIndex}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center space-y-3 pt-8">
                    <div className="mx-auto">
                      {COMPLETION_BENEFITS[currentCardIndex].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {COMPLETION_BENEFITS[currentCardIndex].title}
                    </h3>
                  </CardHeader>
                  <CardContent className="text-center px-8 pb-8">
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {COMPLETION_BENEFITS[currentCardIndex].description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Carousel indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {COMPLETION_BENEFITS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCardIndex(index)}
                  className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                    index === currentCardIndex ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-1 pt-0 pb-4"
        >
          <p className="text-md text-gray-700 font-medium">
            Ready to bring your vision to life?
          </p>
          <p className="text-gray-600 text-sm">
            Click "Finish" below to access the product builder and start
            creating!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
