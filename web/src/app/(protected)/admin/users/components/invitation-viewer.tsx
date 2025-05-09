"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";

interface InvitationViewerProps {
  email: string;
}

export function InvitationViewer({ email }: InvitationViewerProps) {
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        setLoading(true);

        // In a real application, this would be a server action
        // For now, we'll simulate it with a timeout
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate finding the invitation
        setInvitation({
          email,
          invitationUrl: `${window.location.origin}/auth/complete-signup?email=${encodeURIComponent(email)}&mockInvite=true`,
          createdAt: Date.now() / 1000,
        });
      } catch (error) {
        console.error("Error fetching invitation:", error);
      } finally {
        setLoading(false);
      }
    }

    if (email) {
      fetchInvitation();
    }
  }, [email]);

  const copyToClipboard = () => {
    if (invitation?.invitationUrl) {
      navigator.clipboard.writeText(invitation.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Invitation</CardTitle>
          <CardDescription>Retrieving invitation details...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Invitation Found</CardTitle>
          <CardDescription>
            No invitation was found for this email address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation Details</CardTitle>
        <CardDescription>
          The invitation URL for {email} is shown below. In a production
          environment, this would be sent via email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Invitation URL</div>
          <div className="flex items-center gap-2">
            <Input
              value={invitation.invitationUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => window.open(invitation.invitationUrl, "_blank")}
            className="w-full"
          >
            Open Invitation Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
