import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { celebrationAtom, totalXpAtom } from "@/lib/atoms/wizard";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import { Button } from "@/components/ui/button";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUserType,
} from "firebase/auth";
import { useEffect as useReactEffect } from "react";
import { FirebaseProgress } from "@/lib/firebase/client/FirebaseProgress";

export interface MiniWizardProps {
  miniWizardId: MiniWizardId;
  title: string;
  description: string;
  xpReward: number;
  onBack?: () => void;
  onComplete?: (formData: Record<string, any>) => void;
}

export default function MiniWizardBase({
  miniWizardId,
  title,
  description,
  xpReward,
  onBack,
  onComplete,
  children,
}: MiniWizardProps & { children: React.ReactNode }) {
  // Firebase Auth user state
  const [user, setUser] = useState<FirebaseUserType | null>(null);
  useReactEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);
  const [, setCelebration] = useAtom(celebrationAtom);
  const [, setTotalXp] = useAtom(totalXpAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isValid, setIsValid] = useState(false);

  // Update form data
  const updateFormData = (data: Record<string, any>) => {
    console.log(
      `[MiniWizardBase] Updating form data for ${miniWizardId}:`,
      data
    );
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  // Create an instance of FirebaseProgress
  const firebaseProgress = new FirebaseProgress();

  // Handle form submission
  const handleComplete = async () => {
    if (!user?.uid) {
      console.error("[MiniWizardBase] No user found");
      return;
    }

    setIsSubmitting(true);
    console.log(
      `[MiniWizardBase] Completing mini wizard ${miniWizardId} for user ${user.uid}`
    );

    try {
      const result = await firebaseProgress.completeMiniWizard(
        user.uid,
        miniWizardId
      );

      if (result.success) {
        console.log(
          `[MiniWizardBase] Mini wizard completed successfully, XP awarded: ${result.xpAwarded || xpReward}`
        );

        // Update local XP
        setTotalXp((prev) => prev + (result.xpAwarded || xpReward));

        setCelebration({
          show: true,
          miniWizardId,
          xpEarned: result.xpAwarded || xpReward,
          message: `Congratulations! You've completed the ${title} step!`,
        });

        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(formData);
        }

        // Reset form and go to first step
        setCurrentStep(0);
        setFormData({});
      } else {
        console.error(
          `[MiniWizardBase] Error completing mini wizard:`,
          result.error
        );
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error(`[MiniWizardBase] Error completing mini wizard:`, error);
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose handleComplete function globally for main navigation
  useEffect(() => {
    (window as any)[`currentMiniWizard_${miniWizardId}`] = {
      handleComplete,
      isSubmitting,
      isValid,
    };

    return () => {
      delete (window as any)[`currentMiniWizard_${miniWizardId}`];
    };
  }, [handleComplete, isSubmitting, isValid, miniWizardId]);

  // Reset wizard state when unmounted
  useEffect(() => {
    return () => {
      setCurrentStep(0);
      setFormData({});
    };
  }, []);

  return (
    <div className="space-y-4 px-4">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="">
        {/* Render the specific mini-wizard content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper components for mini-wizards
export function MiniWizardStep({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  if (!isActive) return null;

  return <div>{children}</div>;
}
