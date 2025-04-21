"use client";
import "@/app/globals.css";
import Providers from "@/app/providers";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  // Check if the user is authenticated
  const user = clientAuth.currentUser;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [, setSelectedProductId] = useAtom(selectedProductIdAtom);

  useEffect(() => {
    onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        console.log("User is authenticated");

        // Load the selected product from localStorage on login
        // The selectedProductIdAtom from jotai is already reading from localStorage,
        // but we need to initialize it on login to ensure persistence
        try {
          const storedProductId = localStorage.getItem("selectedProductId");
          if (storedProductId) {
            // Try to parse the value (it could be stringified JSON or just the ID)
            try {
              const parsedValue = JSON.parse(storedProductId);
              setSelectedProductId(parsedValue);
            } catch {
              // If parsing fails, use the raw value
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
      } else {
        console.log("User is not authenticated");
        router.push("/auth/signin");
        router.refresh();
      }
    });
  }, [router, user, setSelectedProductId]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  } else {
    return <Providers>{children}</Providers>;
  }
}
