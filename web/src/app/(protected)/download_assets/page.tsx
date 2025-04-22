"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Provider } from "jotai";
import { AssetsDownloader } from "./components/assets-downloader";
import { PhaseToolbar } from "./components/phase-toolbar";
import { ChevronLeft, FileSearch, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

// Go Back Component
function GoBack() {
  const router = useRouter();

  return (
    <Card className="w-full h-fit flex-shrink-0 rounded-lg border">
      <CardTitle className="text-base ml-6 mt-2 mb-0">Go Back</CardTitle>

      <CardContent className="flex flex-col space-y-2 py-3">
        <div
          className="flex items-center justify-between py-1 px-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/answer_questions")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base truncate">
                Answer Questions
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Complete your startup profile
              </p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </div>

        <div
          className="flex items-center justify-between py-1 px-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/review_assets")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <FileSearch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base truncate">
                Review Assets
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Browse product materials
              </p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DownloadAssets() {
  return (
    <Provider>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <div className="flex gap-6 justify-between">
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "Products", href: "/dashboard" },
                  { label: "Product", href: "/product" },
                  {
                    label: "Download Assets",
                    href: "/download_assets",
                    isCurrentPage: true,
                  },
                ]}
              />
              <h2 className="text-2xl font-bold tracking-tight">
                Download Assets
              </h2>
              <p className="text-muted-foreground">
                Download the assets generated for your startup.
              </p>
            </div>

            <div className="mt-6">
              <PhaseToolbar />
            </div>
          </div>
          <div className="w-[30%]">
            <GoBack />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0 mt-6">
          <AssetsDownloader />
        </div>
      </Main>
    </Provider>
  );
}
