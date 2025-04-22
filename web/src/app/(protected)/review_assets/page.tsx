import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Provider } from "jotai";
import { NextStepsCard } from "./next-steps-card";
import { AssetsReviewer } from "./components/assets-reviewer";
import { PhaseToolbar } from "./components/phase-toolbar";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export default function ReviewAssets() {
  return (
    <Provider>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

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

          {/* Next Steps Card Component */}
          <NextStepsCard />
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
          <AssetsReviewer />
        </div>
      </Main>
    </Provider>
  );
}
