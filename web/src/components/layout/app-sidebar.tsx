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
import { userProfileAtom } from "@/lib/store/user-store";
import { NavGroup as NavGroupType } from "./types";
import { launchpadAiStore } from "@/lib/store/general-store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = clientAuth.currentUser;
  const userProfile = launchpadAiStore.get(userProfileAtom);
  const isAdmin =
    userProfile?.userType === "admin" || userProfile?.userType === "superadmin";

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
