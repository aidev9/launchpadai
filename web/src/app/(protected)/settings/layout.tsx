import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./components/sidebar-nav";
import {
  BellIcon,
  CreditCardIcon,
  CoinsIcon,
  MonitorIcon,
  PaletteIcon,
  UserIcon,
  WrenchIcon,
  SettingsIcon,
} from "lucide-react";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: <UserIcon className="h-4 w-4" />,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: <WrenchIcon className="h-4 w-4" />,
  },
  {
    title: "Subscription",
    href: "/settings/subscription",
    icon: <CreditCardIcon className="h-4 w-4" />,
  },
  {
    title: "Prompt Credits",
    href: "/settings/prompt-credits",
    icon: <CoinsIcon className="h-4 w-4" />,
  },
  {
    title: "Tools",
    href: "/settings/tools",
    icon: <SettingsIcon className="h-4 w-4" />,
  },
  // Empty placeholder for future settings
  {
    title: "",
    href: "/settings",
  },

  // {
  //   title: "Appearance",
  //   href: "/settings/appearance",
  //   icon: <PaletteIcon className="h-4 w-4" />,
  // },
  // {
  //   title: "Notifications",
  //   href: "/settings/notifications",
  //   icon: <BellIcon className="h-4 w-4" />,
  // },
  // {
  //   title: "Display",
  //   href: "/settings/display",
  //   icon: <MonitorIcon className="h-4 w-4" />,
  // },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const breadcrumbItems = [{ label: "Settings" }];
  return (
    <Main>
      <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
        <div className="flex-1">
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </Main>
  );
}
