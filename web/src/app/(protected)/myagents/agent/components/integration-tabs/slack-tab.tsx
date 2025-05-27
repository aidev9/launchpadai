"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageSquare } from "lucide-react";
import { Agent } from "@/lib/firebase/schema";

interface SlackTabProps {
  agent: Agent;
}

export function SlackTab({ agent }: SlackTabProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

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
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Slack Integration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Deploy your agent as a Slack bot
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>
              1. Create a new Slack app at{" "}
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                api.slack.com/apps
              </a>
            </li>
            <li>
              2. Enable Bot Token Scopes: <code>chat:write</code>,{" "}
              <code>app_mentions:read</code>
            </li>
            <li>3. Add the webhook URL to your Slack app settings</li>
            <li>4. Install the app to your workspace</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Webhook URL</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/integrations/slack/${agent.id}`,
                  "slack-webhook"
                )
              }
              className="flex items-center gap-2"
            >
              {copiedStates["slack-webhook"] ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedStates["slack-webhook"] ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="p-3 border rounded-lg bg-muted/30">
            <code className="text-sm">
              {typeof window !== "undefined"
                ? window.location.origin
                : "https://your-domain.com"}
              /api/integrations/slack/{agent.id}
            </code>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Required Headers</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm font-mono">X-Slack-Signature</span>
              <span className="text-xs text-muted-foreground">
                Slack request signature
              </span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm font-mono">
                X-Slack-Request-Timestamp
              </span>
              <span className="text-xs text-muted-foreground">
                Request timestamp
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
