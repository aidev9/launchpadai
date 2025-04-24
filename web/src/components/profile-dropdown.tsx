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
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || null);

  // If no user is passed as prop, try to get the current user from Firebase Auth
  useEffect(() => {
    if (!propUser) {
      // Get the current authenticated user
      const user = clientAuth.currentUser;
      setCurrentUser(user);

      // Set up auth state listener for changes
      const unsubscribe = clientAuth.onAuthStateChanged((authUser) => {
        setCurrentUser(authUser);
      });

      // Clean up the listener on unmount
      return () => unsubscribe();
    }
  }, [propUser]);

  // Use a placeholder user for UI when not authenticated
  const displayUser = currentUser || {
    displayName: "User",
    email: "",
    photoURL: "",
  };

  return (
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
          <DropdownMenuItem asChild>
            <Link href="/ftux" className="flex items-center">
              <Compass className="mr-2 h-4 w-4" />
              Start Here
              <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutUser(router)}>
          Sign Out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
