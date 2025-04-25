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
        // console.log("User is not authenticated");
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
        Loading authentication...
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
      <DebugAtoms />
      {/* ===== Top Heading ===== */}
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
