"use client";
import { Main } from "@/components/layout/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Settings() {
  const router = useRouter();
  useEffect(() => {
    router.push("/settings/profile");
  }, [router]);
  return (
    <Main>
      <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
        <Alert variant={"default"} className="w-full">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Settings</AlertTitle>
          <AlertDescription>
            Forwarding you to the profile settings page...
          </AlertDescription>
        </Alert>
      </div>
    </Main>
  );
}
