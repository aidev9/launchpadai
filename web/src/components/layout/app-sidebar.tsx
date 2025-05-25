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
import { clientAuth, clientDb } from "@/lib/firebase/client";
import { NavGroup as NavGroupType } from "./types";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { firebaseUsers } from "@/lib/firebase/client/FirebaseUsers";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = clientAuth.currentUser;
  
  // Get the user reference using the FirebaseUsers class
  const userRef = user ? firebaseUsers.getRefUser() : null;
  
  // Use React Firebase Hooks to get real-time user profile data
  const [userProfile, loading, error] = useDocumentData(userRef);
  
  // Check if user is admin based on the profile data
  const isAdmin =
    userProfile?.userType === "admin" || userProfile?.userType === "superadmin";
    
  if (error) {
    console.error("Error loading user profile for sidebar:", error);
  }

  // Filter nav groups based on admin status
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
