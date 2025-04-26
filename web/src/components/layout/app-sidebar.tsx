import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { ProductSwitcher } from "@/components/layout/product-switcher";
import { sidebarData } from "./data/sidebar-data";
import { clientAuth } from "@/lib/firebase/client";
import { useAtom } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { NavGroup as NavGroupType } from "./types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = clientAuth.currentUser;
  const [isAdmin] = useAtom(isAdminAtom);

  // Filter out admin-only navigation groups for non-admin users
  const filteredNavGroups = sidebarData.navGroups.filter(
    (group) => !group.adminOnly || isAdmin
  );

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <ProductSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props: NavGroupType) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
