"use client";

import "@/app/globals.css";
import Providers from "@/app/providers";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useAtom, useSetAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { setUserProfileAtom } from "@/lib/store/user-store";
import { fetchUserProfile } from "@/lib/firebase/actions/profile";
import { useAtomsDebugValue } from "jotai-devtools/utils";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { motion } from "framer-motion";

const DebugAtoms = () => {
  useAtomsDebugValue();
  return null;
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setSelectedProductId] = useAtom(selectedProductIdAtom);
  const setUserProfile = useSetAtom(setUserProfileAtom);

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        setIsLoading(true);
        setAuthError(null);

        try {
          // Get a fresh ID token
          const idToken = await getIdToken(user, true);

          // Update the session cookie on the server
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });

          if (!sessionResponse.ok) {
            throw new Error("Failed to create session");
          }

          // Fetch user profile data from server action
          const profileResult = await fetchUserProfile();

          if (profileResult.success && profileResult.profile) {
            // Set the user profile in the Jotai atom
            setUserProfile(profileResult.profile);
          } else {
            setUserProfile(null); // Ensure atom is null if profile fetch fails
          }

          // Load the selected product from localStorage if it exists
          try {
            const storedProductId = localStorage.getItem("selectedProductId");
            if (storedProductId) {
              try {
                const parsedValue = JSON.parse(storedProductId);
                setSelectedProductId(parsedValue);
              } catch {
                setSelectedProductId(storedProductId);
              }
            }
          } catch (error) {
            console.log("error:", error);
          }

          // Only set loading to false after session and profile are handled
          setIsLoading(false);
          setAuthError(null);
        } catch (error) {
          console.log("error:", error);
          setUserProfile(null);
          setAuthError(
            "Failed to create a valid session or load profile. Please sign in again."
          );
          // Wait a bit before redirecting to allow user to see the error
          setTimeout(() => {
            router.push("/auth/signin");
          }, 1500);
        }
      } else {
        // Clear profile on sign out detection
        setUserProfile(null);
        setIsLoading(false); // No user, not loading
        setAuthError(null); // Clear any previous auth errors
        router.push("/auth/signin");
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [router, setSelectedProductId, setUserProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          {/* <span className="sr-only">Loading the lauch codes...</span>
          <div className="w-8 h-8">
            <svg
              className="animate-spin text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div> */}

          <AnimatedCode />
          <span className="text-sm text-muted-foreground">
            Loading lauch sequences...
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
      {/* <DebugAtoms /> */}
      <Header>
        <TopNav links={topNav} />
        <div className="ml-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      {children}
    </Providers>
  );
}
