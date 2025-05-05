"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PlusIcon, Cross1Icon } from "@radix-ui/react-icons";

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
    <Card className="overflow-hidden">
      <div className="px-6 py-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="font-medium">{question}</h3>
          <button className="flex items-center justify-center h-6 w-6 rounded-full">
            {isOpen ? (
              <Cross1Icon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {isOpen && (
          <div className="mt-2 text-sm text-muted-foreground">{answer}</div>
        )}
      </div>
    </Card>
  );
}
