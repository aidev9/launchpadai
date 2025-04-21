"use client";
import "@/app/globals.css";
import Providers from "@/app/providers";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  // Check if the user is authenticated
  const user = clientAuth.currentUser;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        console.log("User is authenticated");
        setIsLoading(false);
      } else {
        console.log("User is not authenticated");
        router.push("/auth/signin");
        router.refresh();
      }
    });
  }, [router, user]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  } else {
    return <Providers>{children}</Providers>;
  }
}
