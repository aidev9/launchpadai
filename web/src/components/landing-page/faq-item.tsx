"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PlusIcon, Cross1Icon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  isDefaultOpen?: boolean;
}

export function FAQItem({
  question,
  answer,
  isDefaultOpen = false,
}: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <Card className="overflow-hidden border-primary/10 hover:border-primary/30 transition-colors duration-300">
      <div className="px-6 py-4">
        <motion.div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <h3 className="font-medium">{question}</h3>
          <motion.button
            className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/5"
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(var(--primary), 0.1)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <Cross1Icon className="h-4 w-4 text-primary" />
              ) : (
                <PlusIcon className="h-4 w-4 text-primary" />
              )}
            </motion.div>
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                className="mt-4 text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg"
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {answer}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
