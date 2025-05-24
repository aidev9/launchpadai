"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  McpEndpointConfig,
  McpEndpointConfigInput,
} from "@/lib/firebase/schema/mcp-endpoints";
import { firebaseMcpEndpoints } from "@/lib/firebase/client/FirebaseMcpEndpoints";

interface McpEndpointFormProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  endpointToEdit?: McpEndpointConfig;
  onCreated: (endpoint: McpEndpointConfig) => void;
  onUpdated: (endpoint: McpEndpointConfig) => void;
}

export function McpEndpointForm({
  isOpen,
  onClose,
  collectionId,
  endpointToEdit,
  onCreated,
  onUpdated,
}: McpEndpointFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!endpointToEdit;

  // Form state
  const [name, setName] = useState(endpointToEdit?.name || "");
  const [description, setDescription] = useState(
    endpointToEdit?.description || ""
  );
  const [isEnabled, setIsEnabled] = useState(endpointToEdit?.isEnabled ?? true);
  const [authType, setAuthType] = useState<"api_key" | "bearer_token">(
    endpointToEdit?.authType || "api_key"
  );
  const [apiKey, setApiKey] = useState(
    endpointToEdit?.authCredentials.apiKey || ""
  );
  const [bearerToken, setBearerToken] = useState(
    endpointToEdit?.authCredentials.bearerToken || ""
  );
  const [allowedIps, setAllowedIps] = useState(
    endpointToEdit?.accessControl.allowedIps.join(", ") || ""
  );
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(
    endpointToEdit?.accessControl.rateLimitPerMinute || 60
  );

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate a random API key or bearer token
  const generateRandomToken = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 32;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name is too long (max 100 characters)";
    }

    if (authType === "api_key" && !apiKey.trim()) {
      newErrors.apiKey = "API Key is required";
    }

    if (authType === "bearer_token" && !bearerToken.trim()) {
      newErrors.bearerToken = "Bearer Token is required";
    }

    if (rateLimitPerMinute < 1 || rateLimitPerMinute > 100) {
      newErrors.rateLimitPerMinute = "Rate limit must be between 1 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData: McpEndpointConfigInput = {
        name,
        description,
        isEnabled,
        authType,
        authCredentials: {
          apiKey: authType === "api_key" ? apiKey : undefined,
          bearerToken: authType === "bearer_token" ? bearerToken : undefined,
        },
        accessControl: {
          allowedIps: allowedIps
            .split(",")
            .map((ip) => ip.trim())
            .filter((ip) => ip !== ""),
          rateLimitPerMinute,
        },
      };

      if (isEditing && endpointToEdit) {
        // Update existing endpoint
        const result = await firebaseMcpEndpoints.updateMcpEndpointConfig(
          endpointToEdit.id,
          {
            ...endpointToEdit,
            ...formData,
          }
        );

        if (result.success && result.endpointConfig) {
          toast({
            title: "Success",
            description: "MCP endpoint updated successfully",
          });
          onUpdated(result.endpointConfig);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update MCP endpoint",
            variant: "destructive",
          });
        }
      } else {
        // Create new endpoint
        const result = await firebaseMcpEndpoints.createMcpEndpointConfig(
          formData,
          collectionId
        );

        if (result.success && result.endpointConfig) {
          toast({
            title: "Success",
            description: "MCP endpoint created successfully",
          });
          onCreated(result.endpointConfig);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create MCP endpoint",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit MCP Endpoint" : "Create MCP Endpoint"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection API"
              className={errors.name ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              A short name for this endpoint. This will be visible to clients.
            </p>
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="API endpoint for accessing my collection data"
            />
            <p className="text-xs text-muted-foreground">
              A short description of this endpoint. This will be visible to
              clients.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authType">Authentication Type</Label>
            <Select
              value={authType}
              onValueChange={(value) =>
                setAuthType(value as "api_key" | "bearer_token")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="bearer_token">Bearer Token</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how clients will authenticate with this endpoint
            </p>
          </div>

          {authType === "api_key" && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className={`flex-1 ${errors.apiKey ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApiKey(generateRandomToken())}
                >
                  Generate
                </Button>
              </div>
              {errors.apiKey && (
                <p className="text-xs text-red-500">{errors.apiKey}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Clients will need to provide this API key in the x-api-key
                header
              </p>
            </div>
          )}

          {authType === "bearer_token" && (
            <div className="space-y-2">
              <Label htmlFor="bearerToken">Bearer Token</Label>
              <div className="flex space-x-2">
                <Input
                  id="bearerToken"
                  type="text"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  placeholder="Bearer Token"
                  className={`flex-1 ${
                    errors.bearerToken ? "border-red-500" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBearerToken(generateRandomToken())}
                >
                  Generate
                </Button>
              </div>
              {errors.bearerToken && (
                <p className="text-xs text-red-500">{errors.bearerToken}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Clients will need to provide this token in the Authorization
                header
              </p>
            </div>
          )}

          <div className="flex flex-row justify-between space-x-4">
            <div className="space-y-2">
              <Label htmlFor="authType">Enabled</Label>
              <div className="space-y-0.5"></div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateLimitPerMinute">
                Rate Limit (requests per minute)
              </Label>
              <Input
                id="rateLimitPerMinute"
                type="number"
                min={1}
                max={100}
                value={rateLimitPerMinute}
                onChange={(e) =>
                  setRateLimitPerMinute(parseInt(e.target.value) || 60)
                }
                className={errors.rateLimitPerMinute ? "border-red-500" : ""}
              />
              {errors.rateLimitPerMinute && (
                <p className="text-xs text-red-500">
                  {errors.rateLimitPerMinute}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum number of requests allowed per minute (1-100)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowedIps">Allowed IP Addresses (Optional)</Label>
            <Input
              id="allowedIps"
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.1, 10.0.0.1"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of IP addresses with access to this endpoint.
              Leave empty to allow all IPs.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
