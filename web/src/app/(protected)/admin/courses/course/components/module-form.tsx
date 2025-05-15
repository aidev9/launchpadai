"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { addModule, updateModule } from "@/lib/firebase/courses";
import {
  selectedModuleAtom,
  addModuleModalOpenAtom,
  editModuleModalOpenAtom,
  moduleActionAtom,
} from "./modules-store";
import { Loader2 } from "lucide-react";
import StepIndicator from "./stepIndicator";
import StepContent from "./stepContent";
import { moduleInputSchema, ModuleInput } from "@/lib/firebase/schema";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface ModuleFormProps {
  isEdit?: boolean;
  courseId: string;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({
  isEdit = false,
  courseId,
}) => {
  // Use refs instead of state for file input elements to avoid re-renders
  const currentStepRef = useRef<number>(1);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Get Jotai atoms
  const [selectedModule] = useAtom(selectedModuleAtom);
  const [addModuleModalOpen, setAddModuleModalOpen] = useAtom(
    addModuleModalOpenAtom
  );
  const [editModuleModalOpen, setEditModuleModalOpen] = useAtom(
    editModuleModalOpenAtom
  );
  const setModuleAction = useSetAtom(moduleActionAtom);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ModuleInput>({
    resolver: zodResolver(moduleInputSchema),
    defaultValues: {
      title: "",
      body: "",
      imageUrl: "",
      filePath: "",
      attachments: [],
      tags: [],
      xpAwards: 0,
      notifyStudents: false,
    },
  });

  // When editing, set form values from selected module
  // TODO: Do we need this?
  useEffect(() => {
    if (isEdit && selectedModule) {
      form.reset({
        title: selectedModule.title || "",
        body: selectedModule.body || "",
        imageUrl: selectedModule.imageUrl || "",
        filePath: selectedModule.filePath || "",
        attachments: selectedModule.attachments || [],
        tags: selectedModule.tags || [],
        xpAwards: selectedModule.xpAwards || 0,
        notifyStudents: selectedModule.notifyStudents || false,
      });
    } else {
      form.reset({
        title: "",
        body: "",
        imageUrl: "",
        filePath: "",
        attachments: [],
        tags: [],
        xpAwards: 0,
        notifyStudents: false,
      });
    }
  }, [isEdit, selectedModule, form]);

  // Functions that modify step state through the ref first
  const handleNextStep = () => {
    if (currentStepRef.current < totalSteps) {
      // First update the ref
      const nextStep = currentStepRef.current + 1;
      currentStepRef.current = nextStep;

      // Then update the state safely
      console.log(`Moving from step ${currentStep} to step ${nextStep}`);
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStepRef.current > 1) {
      // First update the ref
      const prevStep = currentStepRef.current - 1;
      currentStepRef.current = prevStep;

      // Then update the state safely
      console.log(`Moving back from step ${currentStep} to step ${prevStep}`);
      setCurrentStep(prevStep);
    }
  };

  // Form submission handler uses refs to get file data
  const onSubmit = async (data: ModuleInput) => {
    if (currentStepRef.current === totalSteps) {
      try {
        // Immediately set submitting state
        setIsSubmitting(true);

        // Prepare a clean copy of form data
        const formData = {
          title: data.title,
          body: data.body,
          imageUrl: data.imageUrl,
          attachments: [...(data.attachments || [])],
          tags: [...(data.tags || [])],
          xpAwards: data.xpAwards,
          notifyStudents: data.notifyStudents,
        };

        const attachments: string[] = formData.attachments;

        // Create the final module data
        const finalModuleData = {
          ...formData,
          attachments,
        };

        // Create a promise for the API call but don't await it yet
        const apiCall = isEdit
          ? updateModule(courseId, selectedModule!.id, finalModuleData)
          : addModule(courseId, finalModuleData);

        // Important: First close the modal before awaiting API response
        // This prevents the step transition flickering
        if (isEdit) {
          setEditModuleModalOpen(false);
        } else {
          setAddModuleModalOpen(false);
        }

        // Now await the API call result
        const result = await apiCall;

        // Only show toast and refresh data if successful
        if (result.success) {
          toast({
            title: isEdit ? "Module updated" : "Module added",
            duration: TOAST_DEFAULT_DURATION,
            description: isEdit
              ? "Module has been updated successfully"
              : "Module has been added successfully",
          });

          // Update the moduleActionAtom to notify other components
          setModuleAction(
            isEdit
              ? { type: "UPDATE", module: result.data }
              : { type: "ADD", module: result.data }
          );

          // Set current step to 1
          currentStepRef.current = 1;
          setCurrentStep(1);

          // Call onSuccess to refresh modules list
          setAddModuleModalOpen(false);
        } else {
          throw new Error(result.error || "Failed to save module");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while saving the module",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog
      open={isEdit ? editModuleModalOpen : addModuleModalOpen}
      onOpenChange={(open) => {
        if (isEdit) {
          setEditModuleModalOpen(open);
        } else {
          setAddModuleModalOpen(open);
        }
        // Reset when closing
        if (!open) {
          currentStepRef.current = 1;
          setCurrentStep(1);
        }
      }}
    >
      <DialogContent className="flex flex-col justify-start max-w-2xl h-132">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Module" : "Add Module"}</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        <Form {...form}>
          <form
            id="moduleForm"
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === totalSteps) {
                form.handleSubmit(onSubmit)(e);
              }
            }}
            className="space-y-6"
          >
            {/* {renderStepContent()} */}
            <StepContent currentStep={currentStep} form={form} />

            <DialogFooter className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
              <div className="flex items-center justify-between w-full">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {currentStep < totalSteps && (
                  <Button variant="default" onClick={handleNextStep}>
                    Next
                  </Button>
                )}
                {currentStep === totalSteps && (
                  <Button
                    type="submit"
                    form="moduleForm"
                    // variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : isEdit ? (
                      "Update Module"
                    ) : (
                      "Add Module"
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
