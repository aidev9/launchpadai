"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface CardRadioProps {
  value: string;
  id: string;
  label: string;
  subtitle?: string;
  footer?: string;
  checked: boolean;
  onValueChange?: (value: string) => void;
}

export function CardRadio({
  value,
  id,
  label,
  subtitle,
  footer,
  checked,
  onValueChange,
}: CardRadioProps) {
  return (
    <motion.div
      className={`relative flex flex-col border rounded-lg p-4 cursor-pointer hover:bg-accent ${
        checked ? "border-primary border-2 bg-primary/5" : "border-border"
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => onValueChange && onValueChange(value)}
    >
      <div className="space-y-1 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-end">
            <h3 className="font-medium text-sm">{label}</h3>
            {checked && (
              <div className="absolute top-6 -translate-y-1/2 right-3">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {footer && (
          <p className="text-[10px] text-muted-foreground align-bottom">
            {footer}
          </p>
        )}
      </div>
      <div className="hidden">
        <RadioGroupItem value={value} id={id} />
      </div>
    </motion.div>
  );
}
