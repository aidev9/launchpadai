"use client";

import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { getModules, deleteModule } from "@/lib/firebase/courses";
import { Module } from "@/lib/firebase/schema";
import {
  editModuleModalOpenAtom,
  selectedModuleAtom,
  moduleActionAtom,
  modulesAtom,
} from "./modules-store";
import { columns } from "./module-columns";
import { ModulesTable } from "./modules-table";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface ModuleListProps {
  courseId: string;
}

export function ModuleList({ courseId }: ModuleListProps) {
  const [modules, setModules] = useAtom(modulesAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const setModuleAction = useSetAtom(moduleActionAtom);
  const moduleAction = useAtomValue(moduleActionAtom);
  const { toast } = useToast();
  const setSelectedModule = useSetAtom(selectedModuleAtom);
  const setEditModuleModalOpen = useSetAtom(editModuleModalOpenAtom);

  // Set up event delegation for row actions
  useEffect(() => {
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const deleteButton = target.closest('[data-action="delete"]');
      const editButton = target.closest('[data-action="edit"]');

      if (deleteButton) {
        const moduleId = deleteButton.getAttribute("data-module-id");
        if (moduleId) {
          const moduleToDelete = modules.find(
            (module) => module.id === moduleId
          );
          if (moduleToDelete) {
            setModuleToDelete(moduleToDelete);
          }
        }
      } else if (editButton) {
        const moduleId = editButton.getAttribute("data-module-id");
        if (moduleId) {
          const moduleToEdit = modules.find((module) => module.id === moduleId);
          if (moduleToEdit) {
            // Set the selected module and open edit modal
            setSelectedModule(moduleToEdit);
            setEditModuleModalOpen(true);
          }
        }
      }
    };

    document.addEventListener("click", handleTableClick);

    return () => {
      document.removeEventListener("click", handleTableClick);
    };
  }, [modules, setSelectedModule, setEditModuleModalOpen]);

  // Fetch modules on component mount
  useEffect(() => {
    if (!courseId) return;

    async function fetchModules() {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getModules(courseId);

        if (result.success) {
          setModules(result.modules);
          // Set a module action to notify other components
          setModuleAction({ type: "SET", modules: result.modules });
        } else {
          setError(result.error || "Failed to fetch modules");
          toast({
            title: "Error",
            duration: TOAST_DEFAULT_DURATION,
            description: result.error || "Failed to fetch modules",
            variant: "destructive",
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchModules();
  }, [courseId, setModuleAction, toast, setModules]);

  // Watch the moduleActionAtom for external changes
  useEffect(() => {
    if (!moduleAction) return;

    switch (moduleAction.type) {
      case "ADD":
        setModules((currentModules) => [
          ...currentModules,
          moduleAction.module,
        ]);
        break;
      case "UPDATE":
        setModules((currentModules) =>
          currentModules.map((module) =>
            module.id === moduleAction.module.id ? moduleAction.module : module
          )
        );
        break;
      case "DELETE":
        setModules((currentModules) =>
          currentModules.filter((module) => module.id !== moduleAction.moduleId)
        );
        break;
      case "SET":
        // Already handled in the fetch effect
        break;
      case "DELETE_MANY":
        setModules((currentModules) =>
          currentModules.filter(
            (module) => !moduleAction.moduleIds.includes(module.id)
          )
        );
        break;
    }
  }, [moduleAction, setModules]);

  // Execute module deletion
  const executeDelete = async () => {
    if (!moduleToDelete || !courseId) return;

    try {
      setIsDeleting(true);
      const result = await deleteModule(courseId, moduleToDelete.id);

      if (result.success) {
        // Update the local state
        setModules((currentModules) =>
          currentModules.filter((module) => module.id !== moduleToDelete.id)
        );

        // Set module action to notify other components
        setModuleAction({ type: "DELETE", moduleId: moduleToDelete.id });

        toast({
          title: "Module deleted",
          duration: TOAST_DEFAULT_DURATION,
          description: "Module has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description: result.error || "Failed to delete module",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setModuleToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading modules...</div>;
  }

  return (
    <div className="space-y-6">
      <ModulesTable columns={columns} data={modules} courseId={courseId} />

      {/* Deletion confirmation dialog */}
      <AlertDialog
        open={!!moduleToDelete}
        onOpenChange={() => setModuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              module "{moduleToDelete?.title}" and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
