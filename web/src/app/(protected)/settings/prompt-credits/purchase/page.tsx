import { Metadata } from "next";
import { PromptPackPurchase } from "./components/prompt-pack-purchase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export const metadata: Metadata = {
  title: "Purchase Prompt Credits | Settings | LaunchpadAI",
  description:
    "Purchase additional prompt credits to use with LaunchpadAI's AI features",
};

export default function SettingsPurchaseCreditsPage() {
  return (
    <div className="space-y-6">
      {/* Add Back button */}
      <div className="flex items-center justify-between">
        <Link href="/settings/prompt-credits">
          
          <Button variant="outline"><ArrowLeftIcon className="h-4 w-4" />Back</Button>
        </Link>
      </div>
      <div>
        <h3 className="text-lg font-medium">Purchase Prompt Credits</h3>
        <p className="text-sm text-muted-foreground">
          Add more AI prompt credits to your account by purchasing a credit
          pack below.
        </p>
      </div>

      <PromptPackPurchase />
    </div>
  );
}
