"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignOutHelper } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";

interface SignOutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function SignOutButton({
  variant = "default",
  size = "default",
  className = "",
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const signOutAndClearProfile = SignOutHelper();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      console.log("Starting sign-out process via SignOutHelper...");

      await signOutAndClearProfile(router);

      console.log("Sign-out process completed by SignOutHelper.");
    } catch (error) {
      console.error("Error during sign-out process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
