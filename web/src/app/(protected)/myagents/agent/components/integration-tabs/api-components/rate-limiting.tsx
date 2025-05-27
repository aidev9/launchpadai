"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface RateLimitingProps {
  agent: Agent;
  currentConfig: {
    rateLimit: number;
  };
  onUpdate: (updates: Partial<Agent["configuration"]>) => Promise<void>;
}

export function RateLimiting({
  agent,
  currentConfig,
  onUpdate,
}: RateLimitingProps) {
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [editingRateLimit, setEditingRateLimit] = useState(
    currentConfig.rateLimit
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = () => {
    return editingRateLimit !== currentConfig.rateLimit;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        rateLimitPerMinute: editingRateLimit,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Rate Limiting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">Enable Rate Limiting</Label>
            <p className="text-xs text-muted-foreground">
              Limit requests per minute
            </p>
          </div>
          <Switch
            checked={rateLimitEnabled}
            onCheckedChange={setRateLimitEnabled}
          />
        </div>

        {rateLimitEnabled && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Requests per minute</Label>
            <Input
              type="number"
              value={editingRateLimit}
              onChange={(e) =>
                setEditingRateLimit(parseInt(e.target.value) || 100)
              }
              min="1"
              max="10000"
            />
            <p className="text-xs text-muted-foreground">
              Current limit: {currentConfig.rateLimit} requests per minute
            </p>
          </div>
        )}

        {hasChanges() && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {isSaving ? "Saving..." : "Save Rate Limit"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
