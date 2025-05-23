"use client";

import "@/app/globals.css";
import Providers from "@/app/providers";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useAtom, useSetAtom } from "jotai";
import { setUserProfileAtom } from "@/lib/store/user-store";
import { Header } from "@/components/layout/header";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import SkipToMain from "@/components/skip-to-main";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

const topNav = [
  {
    title: "Overview",
    href: "dashboard/overview",
    isActive: true,
    disabled: false,
  },
  {
    title: "Customers",
    href: "dashboard/customers",
    isActive: false,
    disabled: true,
  },
  {
    title: "Products",
    href: "dashboard/products",
    isActive: false,
    disabled: true,
  },
  {
    title: "Settings",
    href: "dashboard/settings",
    isActive: false,
    disabled: true,
  },
];

const DIGIT_COUNT = 10;

function getRandomDigits() {
  return Array.from({ length: DIGIT_COUNT }, () =>
    Math.floor(Math.random() * 10)
  );
}

const AnimatedCode = () => {
  const [digits, setDigits] = useState(getRandomDigits());
  const [isMounted, setIsMounted] = useState(false);

  // Only run client-side
  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setDigits(getRandomDigits());
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // If not mounted yet (i.e., during server-side rendering), show static digits
  if (!isMounted) {
    return (
      <div className="flex space-x-1 font-mono text-2xl text-gray-400">
        {Array(DIGIT_COUNT)
          .fill(0)
          .map((_, idx) => (
            <span key={idx}>0</span>
          ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-1 font-mono text-2xl text-gray-400">
      {digits.map((digit, idx) => (
        <motion.span
          key={idx + "-" + digit}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {digit}
        </motion.span>
      ))}
    </div>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const setUserProfile = useSetAtom(setUserProfileAtom);
  const [redirectedToAdmin, setRedirectedToAdmin] = useState(false);
  const defaultOpen = Cookies.get("sidebar:state") !== "false";

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        console.log("User is signed out");
        await fetch("/api/auth/session", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setUserProfile(null);
        setIsLoading(false); // No user, not loading
        setAuthError(null); // Clear any previous auth errors
        router.push("/auth/signin");
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [router, setUserProfile, redirectedToAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <AnimatedCode />
          <span className="text-sm text-muted-foreground">
            Loading launch codes...
          </span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500">{authError}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => router.push("/auth/signin")}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <Providers>
      {/* Protected layout with sidebar */}
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <div
          id="content"
          className={cn(
            "ml-auto w-full max-w-full",
            "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
            "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
            "transition-[width] duration-200 ease-linear",
            "flex h-svh flex-col",
            "group-data-[scroll-locked=1]/body:h-full",
            "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
          )}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header>
              <div className="ml-auto flex items-center space-x-4">
                <FeedbackButton />
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </Header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </Providers>
  );
}
