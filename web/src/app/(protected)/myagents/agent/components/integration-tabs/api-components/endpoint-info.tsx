"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check, Globe } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface EndpointInfoProps {
  agent: Agent;
}

export function EndpointInfo({ agent }: EndpointInfoProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const getEndpointUrl = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://your-domain.com";
    return `${baseUrl}/api/agents/public/${agent.id}/chat`;
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Endpoint Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">API Endpoint</Label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              POST
            </Badge>
            <code className="flex-1 p-2 border rounded text-xs bg-muted/30 truncate">
              {getEndpointUrl()}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(getEndpointUrl(), "endpoint")}
            >
              {copiedStates["endpoint"] ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
