"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { SignOutHelper } from "@/lib/firebase/client";
import { Compass, Star } from "lucide-react";
import XpDisplay from "@/xp/xp-display";
import { useAtomValue } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlanType } from "@/stores/subscriptionStore";

function getInitials(displayName: string | null | undefined): string {
  if (!displayName) {
    return "U";
  }
  const words = displayName.split(" ");
  const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");
  return initials.length > 2 ? initials.slice(0, 2) : initials;
}

export function ProfileDropdown() {
  const router = useRouter();
  const signOutAndClearProfile = SignOutHelper();
  const userProfile = useAtomValue(userProfileAtom);

  // Check if user has a free plan or needs upgrade
  const subscription = userProfile?.subscription as string | undefined;
  const isPremiumPlan =
    subscription === "builder" || subscription === "accelerator";
  const needsUpgrade = !isPremiumPlan;

  return (
    <div className="flex items-center gap-3">
      <XpDisplay />

      {needsUpgrade && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 rounded-full bg-gradient-to-r text-amber-950 hover:from-amber-100 hover:to-amber-200 border-amber-400"
              onClick={() => router.push("/upgrade")}
            >
              <Star className="h-4 w-4 mr-0 fill-amber-500 stroke-0" />
              <span className="text-xs font-medium">Upgrade</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade your subscription for more features!</p>
          </TooltipContent>
        </Tooltip>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userProfile?.photoURL || undefined}
                alt={userProfile?.displayName || "User"}
              />
              <AvatarFallback>
                {getInitials(userProfile?.displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userProfile?.displayName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                <span className="truncate text-xs">{userProfile?.email}</span>
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href="/welcome" className="flex w-full">
                <Compass className="mr-2 h-4 w-4" />
                Start Here
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/dashboard" className="flex w-full">
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="flex w-full">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings/subscription" className="flex w-full">
                Subscription
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // Access the handleOpenFeedback function from the parent component
              const event = new CustomEvent("openFeedback");
              document.dispatchEvent(event);
            }}
          >
            Send Feedback
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/upgrade" className="flex w-full">
              Upgrade
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              try {
                await signOutAndClearProfile(router);
              } catch (error) {
                console.error("Error signing out: ", error);
              }
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
