"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toggleAgentStatus } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface StatusToggleProps {
  agentId: string;
  isEnabled: boolean;
  variant?: "switch" | "badge";
  size?: "sm" | "default";
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function StatusToggle({
  agentId,
  isEnabled,
  variant = "switch",
  size = "default",
  disabled = false,
  onClick,
}: StatusToggleProps) {
  const [optimisticEnabled, setOptimisticEnabled] = useState(isEnabled);
  const { toast } = useToast();

  // Update optimistic state when prop changes
  useEffect(() => {
    setOptimisticEnabled(isEnabled);
  }, [isEnabled]);

  const { execute, status } = useAction(toggleAgentStatus, {
    onSuccess: (data) => {
      const message =
        (data.data as any)?.message || "Agent status updated successfully";
      toast({
        title: "Success",
        description: message,
        duration: TOAST_DEFAULT_DURATION,
      });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setOptimisticEnabled(isEnabled);
      console.error("Toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling
    if (onClick) onClick(e);

    if (disabled || status === "executing") return;

    const newStatus = !optimisticEnabled;

    // Optimistic update
    setOptimisticEnabled(newStatus);

    // Execute the action
    execute({
      agentId,
      isEnabled: newStatus,
    });
  };

  const isLoading = status === "executing";

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={`cursor-pointer transition-colors ${
          optimisticEnabled
            ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
            : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
        } ${isLoading ? "opacity-50" : ""} ${
          size === "sm" ? "text-xs px-2 py-1" : ""
        }`}
        onClick={handleToggle}
        data-testid={`status-badge-${agentId}`}
      >
        {optimisticEnabled ? (
          <Check className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
        ) : (
          <X className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
        )}
        {optimisticEnabled ? "Enabled" : "Disabled"}
      </Badge>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={optimisticEnabled}
        onCheckedChange={(checked) => {
          if (disabled || isLoading) return;

          // Optimistic update
          setOptimisticEnabled(checked);

          // Execute the action
          execute({
            agentId,
            isEnabled: checked,
          });
        }}
        disabled={disabled || isLoading}
        className={`${size === "sm" ? "scale-75" : ""}`}
        data-testid={`status-switch-${agentId}`}
      />
      <span
        className={`text-sm ${
          optimisticEnabled ? "text-green-600" : "text-red-600"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        {optimisticEnabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}
