"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AlphaWarningAlert() {
  return (
    <Alert variant="warning" className="mb-6">
      <IconAlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-bold">Early Alpha Release</AlertTitle>
      <AlertDescription>
        We're actively developing LaunchpadAI with daily updates. As an alpha
        release, you may encounter unstable features or occasional data loss. If
        you run into any issues, contact us through the help center. Your
        feedback helps us improve!
      </AlertDescription>
    </Alert>
  );
}
