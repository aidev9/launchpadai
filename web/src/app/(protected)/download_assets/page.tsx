"use client";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AssetsDownloader } from "./components/assets-downloader";
import { PhaseToolbar } from "./components/phase-toolbar";
import { NextStepsHorizontal } from "./next-steps-horizontal";
import { DownloadButton } from "./components/download-button";
import { toast as showToast } from "@/hooks/use-toast";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export default function DownloadAssets() {
  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  return (
    <Main>
      <div className="mb-6">
        <div className="flex-1">
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
          <div className="flex justify-between items-center mt-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Download Assets
            </h2>
            <DownloadButton onShowToast={showToastHandler} />
          </div>
          <p className="text-muted-foreground">
            Download the assets generated for your startup.
          </p>

          <div className="mt-6">
            <PhaseToolbar />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
        <AssetsDownloader />
        {/* Horizontal Next Steps Navigation at bottom */}
        <NextStepsHorizontal />
      </div>
    </Main>
  );
}
