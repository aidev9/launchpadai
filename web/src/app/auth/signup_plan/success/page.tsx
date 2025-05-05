"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to FTUX after a delay
    const timer = setTimeout(() => {
      router.push("/ftux");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12">
      <div className="container flex w-full flex-col items-center justify-center space-y-6 px-4 sm:w-[500px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <CheckCircle className="h-16 w-16 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Subscription Successful!
          </h1>
          <p className="text-muted-foreground">
            Thank you for subscribing to LaunchpadAI.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Your account is ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              You'll be automatically redirected to get started in a few
              seconds.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/ftux")}>
                Continue to Launch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
