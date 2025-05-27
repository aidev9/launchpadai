"use client";

import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Check,
  X,
  Key,
  TestTube,
  AlertCircle,
  Info,
} from "lucide-react";
import { ToolConfig, ToolConfigField } from "../types";
import { saveToolConfig, testToolConnection } from "../actions";
import { toast } from "sonner";

interface ToolConfigDialogProps {
  tool: ToolConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTool: ToolConfig) => void;
}

export function ToolConfigDialog({
  tool,
  open,
  onOpenChange,
  onSave,
}: ToolConfigDialogProps) {
  const [isEnabled, setIsEnabled] = useState(tool.isEnabled);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: Date;
  } | null>(null);

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, string> = {};
    tool.configFields?.forEach((field) => {
      if (field.key === "apiKey" && tool.apiKey) {
        initialData[field.key] = tool.apiKey;
      } else {
        initialData[field.key] = "";
      }
    });
    setFormData(initialData);
  }, [tool]);

  // Save configuration action
  const { execute: executeSave, status: saveStatus } = useAction(
    saveToolConfig,
    {
      onSuccess: ({ data }) => {
        toast.success("Tool configuration saved successfully");

        // Update the tool with new configuration
        const updatedTool: ToolConfig = {
          ...tool,
          isEnabled,
          apiKey: formData.apiKey,
          // Only update test status if we have a test result, otherwise preserve existing status
          testStatus: testResult
            ? testResult.success
              ? "success"
              : "error"
            : tool.testStatus || "never",
          testMessage: testResult?.message || tool.testMessage,
          lastTested: testResult?.timestamp || tool.lastTested,
          tested: testResult ? true : tool.tested,
        };

        onSave(updatedTool);
      },
      onError: (error) => {
        toast.error("Failed to save configuration");
        console.error("Save error:", error);
      },
    }
  );

  // Test connection action
  const { execute: executeTest, status: testStatus } = useAction(
    testToolConnection,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setTestResult(data);
          if (data.success) {
            toast.success("Connection test successful");
          } else {
            toast.error(`Connection test failed: ${data.message}`);
          }
        }
      },
      onError: (error) => {
        toast.error("Failed to test connection");
        console.error("Test error:", error);
        setTestResult({
          success: false,
          message: "Failed to test connection",
          timestamp: new Date(),
        });
      },
    }
  );

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear test result when configuration changes
    if (testResult) {
      setTestResult(null);
    }
  };

  const handleTest = () => {
    if (!tool.apiKeyRequired) {
      // For tools that don't require API keys, simulate a successful test
      setTestResult({
        success: true,
        message: "Tool is ready to use",
        timestamp: new Date(),
      });
      return;
    }

    executeTest({
      toolId: tool.id,
      apiKey: formData.apiKey,
      config: formData,
    });
  };

  const handleSave = () => {
    executeSave({
      toolId: tool.id,
      isEnabled,
      apiKey: formData.apiKey,
      config: formData,
    });
  };

  const canTest = tool.apiKeyRequired ? !!formData.apiKey : true;
  const canSave = !tool.apiKeyRequired || !!formData.apiKey;

  const renderConfigField = (field: ToolConfigField) => {
    const value = formData[field.key] || "";

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className="flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.key === "apiKey" && (
            <Key className="h-3 w-3 text-yellow-600" />
          )}
        </Label>

        {field.type === "select" ? (
          <select
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={field.key}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            data-testid={`config-${field.key}`}
          />
        )}

        {field.description && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {field.description}
          </p>
        )}
      </div>
    );
  };

  const ToolIcon = tool.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid={`tool-config-dialog-${tool.id}`}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ToolIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{tool.name} Configuration</DialogTitle>
              <DialogDescription>
                Configure settings for {tool.provider}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Enable Tool</Label>
              <p className="text-sm text-muted-foreground">
                Allow agents to use this tool
              </p>
            </div>
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              data-testid="tool-enabled-toggle"
            />
          </div>

          {/* Configuration Fields */}
          {tool.configFields && tool.configFields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Configuration</h4>
                {tool.apiKeyRequired && (
                  <Badge variant="secondary" className="text-xs">
                    <Key className="h-3 w-3 mr-1" />
                    API Key Required
                  </Badge>
                )}
              </div>

              {tool.configFields.map(renderConfigField)}
            </div>
          )}

          {/* Test Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Test Connection</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!canTest || testStatus === "executing"}
                data-testid="test-connection-button"
              >
                {testStatus === "executing" ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-3 w-3 mr-2" />
                )}
                {testStatus === "executing" ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {/* Test Result */}
            {testResult && (
              <Alert
                className={
                  testResult.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription
                      className={
                        testResult.success ? "text-green-800" : "text-red-800"
                      }
                    >
                      {testResult.message}
                    </AlertDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tested at {testResult.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            {!canTest && tool.apiKeyRequired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please enter an API key to test the connection.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tool Description */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveStatus === "executing"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saveStatus === "executing"}
            data-testid="save-tool-config"
          >
            {saveStatus === "executing" ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : null}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
