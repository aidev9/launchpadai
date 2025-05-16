import { Metadata } from "next";
import { CreditBalance } from "@/components/prompt-credits/credit-balance";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prompt Credits | Settings | LaunchpadAI",
  description: "Manage your AI prompt credits",
};

export default function PromptCreditsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Prompt Credits</h3>
        <p className="text-sm text-muted-foreground">
          Manage your AI prompt credits to power LaunchpadAI's intelligent
          features.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current credit balance */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>
              Your current prompt credit balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreditBalance />
          </CardContent>
        </Card>

        {/* What are prompt credits? */}
        <Card>
          <CardHeader>
            <CardTitle>What are Prompt Credits?</CardTitle>
            <CardDescription>
              Understanding how prompt credits work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Prompt credits are used each time you interact with LaunchpadAI's
              AI features. Each subscription plan comes with a preset number of
              credits:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Free Plan:</strong> 10 prompts per day
              </li>
              <li>
                <strong>Explorer Plan:</strong> 300 prompts per month
              </li>
              <li>
                <strong>Builder Plan:</strong> 600 prompts per month
              </li>
              <li>
                <strong>Enterprise Plan:</strong> 900 prompts per month
              </li>
            </ul>
            <p>
              When your credits run low, you can purchase additional credits to
              continue using AI features without interruption.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/settings/prompt-credits/purchase">
                Purchase Credits
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
