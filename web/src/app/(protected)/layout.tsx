"use client";
import "@/app/globals.css";
import Providers from "@/app/providers";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setSelectedProductId] = useAtom(selectedProductIdAtom);

  useEffect(() => {
    // Initialize auth state
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        console.log("User is authenticated in Firebase client");

        try {
          // Get a fresh ID token
          const idToken = await getIdToken(user, true);

          // Update the session cookie on the server
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            throw new Error("Failed to create session");
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
              console.log(
                "Loaded selected product from localStorage:",
                storedProductId
              );
            }
          } catch (error) {
            console.error("Error reading product from localStorage:", error);
          }

          setIsLoading(false);
          setAuthError(null);
        } catch (error) {
          console.error("Error refreshing session:", error);
          setAuthError(
            "Failed to create a valid session. Please sign in again."
          );
          router.push("/auth/signin");
        }
      } else {
        console.log("User is not authenticated");
        // setAuthError("Please sign in to access this page");
        router.push("/auth/signin");
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [router, setSelectedProductId, clientAuth]);

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

  return <Providers>{children}</Providers>;
}
