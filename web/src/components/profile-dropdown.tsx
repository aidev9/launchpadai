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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { signOutUser, clientAuth } from "@/lib/firebase/client";
import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import XpDisplay from "@/xp/xp-display";

// TODO: Refactor this function to reduce code duplication
function getInitials(displayName: string | null): import("react").ReactNode {
  // If displayName is null or empty, return a fallback
  if (!displayName) {
    return "U"; // Fallback initials
  }
  // Split the displayName into words
  const words = displayName.split(" ");
  // Get the first letter of each word
  const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");
  // If initials are more than 2 characters, return the first 2
  return initials.length > 2 ? initials.slice(0, 2) : initials;
}

export function ProfileDropdown({ user: propUser }: { user?: User | null }) {
  const router = useRouter();
  const [displayUser, setDisplayUser] = useState<any>({
    displayName: propUser?.displayName || "",
    email: propUser?.email || "",
    photoURL: propUser?.photoURL || "",
  });

  useEffect(() => {
    const unsubscribe = clientAuth.onAuthStateChanged((user) => {
      if (user) {
        setDisplayUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      } else if (propUser) {
        setDisplayUser({
          displayName: propUser.displayName,
          email: propUser.email,
          photoURL: propUser.photoURL,
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [propUser]);

  return (
    <div className="flex items-center gap-4">
      <XpDisplay />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={displayUser.photoURL || undefined}
                alt={displayUser.displayName || "User"}
              />
              <AvatarFallback>
                {getInitials(displayUser.displayName || null)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {displayUser.displayName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                <span className="truncate text-xs">{displayUser.email}</span>
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
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
              <Link href="/ftux" className="flex w-full">
                <Compass className="mr-2 h-4 w-4" />
                Start Here
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="flex w-full">
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOutUser()
                .then(() => {
                  router.push("/auth/signin");
                })
                .catch((error) => {
                  console.error("Error signing out: ", error);
                });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
