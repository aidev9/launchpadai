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
    <div
      data-testid="wizard-completion"
      className="min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-100 px-12"
    >
      {showConfetti && (
        <Confetti recycle={false} numberOfPieces={400} gravity={0.3} />
      )}

      <div className="max-w-6xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1
            data-testid="completion-title"
            className="text-4xl font-bold text-gray-900"
          >
            🎉 Amazing Work!
          </h1>
          <p
            data-testid="completion-message"
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            You've successfully completed the wizard and created your product
            blueprint!
          </p>
          <div
            data-testid="completion-xp"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-800 font-semibold"
          >
            <span className="text-2xl">🏆</span>
            <span>Total XP Earned: {totalXp}</span>
          </div>
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
                transition={{ duration: 0.5, ease: "easeInOut" }}
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
        <div className="text-center space-y-1 pt-0 pb-4">
          <p className="text-md text-gray-700 font-medium">
            Ready to bring your vision to life?
          </p>
          <p className="text-gray-600 text-sm">
            Click "Finish" below to access the product builder and start
            creating!
          </p>
        </div>
      </div>
    </div>
  );
}
