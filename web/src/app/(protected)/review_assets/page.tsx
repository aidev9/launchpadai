"use client";

import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NextStepsHorizontal } from "./next-steps-horizontal";
import AssetsReviewer from "./components/assets-reviewer";
import { PhaseToolbar } from "./components/phase-toolbar";
import { AddAssetButton } from "./components/add-asset-button";
import { toast as showToast } from "@/hooks/use-toast";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export default function ReviewAssets() {
  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  return (
    <Main>
      <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
        <div className="flex-1">
          <Breadcrumbs
            items={[
              { label: "Products", href: "/dashboard" },
              { label: "Product", href: "/product" },
              {
                label: "Review Assets",
                href: "/review_assets",
                isCurrentPage: true,
              },
            ]}
          />
          <h2 className="text-2xl font-bold tracking-tight mt-4">
            Review Assets
          </h2>
          <p className="text-muted-foreground">
            View and edit the assets generated for your startup.
          </p>

          <div className="mt-6">
            <PhaseToolbar />
          </div>
        </div>

        {/* Add Asset Button */}
        <div className="flex items-start mt-6 md:mt-0">
          <AddAssetButton />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
        <AssetsReviewer onShowToast={showToastHandler} />
        {/* Horizontal Next Steps Navigation at bottom */}
        <NextStepsHorizontal />
      </div>
    </Main>
  );
}
