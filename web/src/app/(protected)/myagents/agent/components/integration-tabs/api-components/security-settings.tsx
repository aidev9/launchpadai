"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Shield, RefreshCw, Save } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface SecuritySettingsProps {
  agent: Agent;
  currentConfig: {
    authType: "bearer" | "apikey" | "none";
    responseType: "streaming" | "single";
    rateLimit: number;
    ipWhitelist: string;
    ipWhitelistEnabled: boolean;
    apiKey: string;
  };
  onUpdate: (updates: Partial<Agent["configuration"]>) => Promise<void>;
  isSaving: boolean;
}

export function SecuritySettings({
  agent,
  currentConfig,
  onUpdate,
  isSaving,
}: SecuritySettingsProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [editingAuthType, setEditingAuthType] = useState(
    currentConfig.authType
  );
  const [editingResponseType, setEditingResponseType] = useState(
    currentConfig.responseType
  );
  const [editingApiKey, setEditingApiKey] = useState("");
  const [editingIpWhitelist, setEditingIpWhitelist] = useState(
    currentConfig.ipWhitelist
  );
  const [editingIpWhitelistEnabled, setEditingIpWhitelistEnabled] = useState(
    currentConfig.ipWhitelistEnabled
  );

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const generateApiKey = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 32;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setEditingApiKey(result);
  };

  const hasChanges = () => {
    return (
      editingAuthType !== currentConfig.authType ||
      editingResponseType !== currentConfig.responseType ||
      editingApiKey !== currentConfig.apiKey ||
      editingIpWhitelist !== currentConfig.ipWhitelist ||
      editingIpWhitelistEnabled !== currentConfig.ipWhitelistEnabled
    );
  };

  const handleSave = async () => {
    const updates: Partial<Agent["configuration"]> = {
      authType: editingAuthType,
      responseType: editingResponseType,
      allowedIps: editingIpWhitelistEnabled
        ? editingIpWhitelist
            .split(",")
            .map((ip) => ip.trim())
            .filter((ip) => ip.length > 0)
        : [],
    };

    if (editingApiKey && editingApiKey !== currentConfig.apiKey) {
      updates.apiKey = editingApiKey;
    }

    await onUpdate(updates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Authentication Type</Label>
          <Select
            value={editingAuthType}
            onValueChange={(value: "bearer" | "apikey" | "none") =>
              setEditingAuthType(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="apikey">API Key</SelectItem>
              <SelectItem value="none">No Authentication</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {currentConfig.apiKey
              ? "Currently configured with API key authentication"
              : "Choose how clients will authenticate with your API"}
          </p>
        </div>

        {editingAuthType !== "none" && (
          <div className="space-y-4">
            {/* Current Saved API Key Display */}
            {currentConfig.apiKey && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Current API Key</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 border rounded text-xs bg-muted/30 font-mono">
                    {`${currentConfig.apiKey.substring(0, 8)}${"*".repeat(24)}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(currentConfig.apiKey, "current-api-key")
                    }
                    className="flex items-center gap-1"
                  >
                    {copiedStates["current-api-key"] ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is the currently active API key for authentication
                </p>
              </div>
            )}

            {/* New API Key Generation */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {currentConfig.apiKey ? "Generate New API Key" : "API Key"}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={editingApiKey}
                  onChange={(e) => setEditingApiKey(e.target.value)}
                  placeholder={
                    currentConfig.apiKey
                      ? "Generate a new API key..."
                      : "Enter or generate API key"
                  }
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateApiKey}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {editingAuthType === "bearer"
                  ? "Clients will need to provide this token in the Authorization header"
                  : "Clients will need to provide this key in the X-API-Key header"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">IP Whitelist</Label>
            <p className="text-xs text-muted-foreground">
              Restrict access to specific IP addresses
            </p>
          </div>
          <Switch
            checked={editingIpWhitelistEnabled}
            onCheckedChange={setEditingIpWhitelistEnabled}
          />
        </div>

        {editingIpWhitelistEnabled && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Allowed IP Addresses</Label>
            <Textarea
              placeholder="192.168.1.1&#10;10.0.0.0/24&#10;203.0.113.0"
              value={editingIpWhitelist}
              onChange={(e) => setEditingIpWhitelist(e.target.value)}
              className="text-xs"
              rows={3}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-medium">Response Type</Label>
          <Select
            value={editingResponseType}
            onValueChange={(value: "streaming" | "single") =>
              setEditingResponseType(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streaming">Streaming Response</SelectItem>
              <SelectItem value="single">Single Response</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {editingResponseType === "streaming"
              ? "Response is streamed in real-time as it's generated"
              : "Complete response is returned as a single JSON object"}
          </p>
        </div>

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
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
