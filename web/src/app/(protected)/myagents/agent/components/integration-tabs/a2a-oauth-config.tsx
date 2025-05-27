"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Save, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";

interface A2aOAuthConfigProps {
  agent: Agent;
  onUpdate: (updates: Partial<Agent["configuration"]>) => Promise<void>;
  isSaving: boolean;
}

export function A2aOAuthConfig({
  agent,
  onUpdate,
  isSaving,
}: A2aOAuthConfigProps) {
  const [clientId, setClientId] = useState(
    agent.configuration.a2aOAuth?.clientId || ""
  );
  const [clientSecret, setClientSecret] = useState(
    agent.configuration.a2aOAuth?.clientSecret || ""
  );
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateCredentials = () => {
    const newClientId = `a2a_${agent.id.slice(0, 8)}_${Date.now()}`;
    const newClientSecret = `a2a_secret_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    setClientId(newClientId);
    setClientSecret(newClientSecret);
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: "Error",
        description: "Both Client ID and Client Secret are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpdate({
        a2aOAuth: {
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        },
      });

      toast({
        title: "Success",
        description: "A2A OAuth credentials saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save A2A OAuth credentials.",
        variant: "destructive",
      });
    }
  };

  const hasCredentials =
    agent.configuration.a2aOAuth?.clientId &&
    agent.configuration.a2aOAuth?.clientSecret;
  const hasUnsavedChanges =
    clientId !== (agent.configuration.a2aOAuth?.clientId || "") ||
    clientSecret !== (agent.configuration.a2aOAuth?.clientSecret || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>OAuth 2.0 Configuration</span>
          <Button
            variant="outline"
            size="sm"
            onClick={generateCredentials}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure OAuth 2.0 credentials for secure A2A authentication.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <div className="flex items-center gap-2">
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
              disabled={isSaving}
            />
            {clientId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(clientId, "clientId")}
                disabled={isSaving}
              >
                {copiedStates["clientId"] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="clientSecret"
                type={showClientSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter client secret"
                disabled={isSaving}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowClientSecret(!showClientSecret)}
                disabled={isSaving}
              >
                {showClientSecret ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </div>
            {clientSecret && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(clientSecret, "clientSecret")}
                disabled={isSaving}
              >
                {copiedStates["clientSecret"] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {hasCredentials ? (
              <span className="text-green-600">
                ✓ OAuth credentials configured
              </span>
            ) : (
              <span className="text-amber-600">
                ⚠ OAuth credentials not configured
              </span>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              !hasUnsavedChanges ||
              !clientId.trim() ||
              !clientSecret.trim()
            }
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Credentials"}
          </Button>
        </div>

        {hasCredentials && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">OAuth Endpoints</h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium">Authorization URL:</span>
                <code className="ml-2 bg-background px-1 py-0.5 rounded">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000"}
                  /api/a2a/auth/authorize
                </code>
              </div>
              <div>
                <span className="font-medium">Token URL:</span>
                <code className="ml-2 bg-background px-1 py-0.5 rounded">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000"}
                  /api/a2a/auth/token
                </code>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
