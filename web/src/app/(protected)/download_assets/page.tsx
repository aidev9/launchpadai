import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Provider } from "jotai";
import { AssetsDownloader } from "./components/assets-downloader";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

export default async function DownloadAssets() {
  return (
    <Provider>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Products", href: "/dashboard" },
              { label: "Product", href: "/product" },
              {
                label: "Download Assets",
                href: "/download_assets",
                isCurrentPage: true,
              },
            ]}
          />
          <h2 className="text-2xl font-bold tracking-tight mt-4">
            Download Assets
          </h2>
          <p className="text-muted-foreground">
            Download the assets generated for your startup.
          </p>
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
          <AssetsDownloader />
        </div>
      </Main>
    </Provider>
  );
}
