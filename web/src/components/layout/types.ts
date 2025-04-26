import { LinkProps as NextLinkProps } from "next/link";
import { ComponentType } from "react";
import { IconProps } from "@tabler/icons-react";

interface Team {
  name: string;
  logo: React.ElementType;
  plan: string;
}

export interface NavLink {
  title: string;
  url: string;
  icon?: ComponentType<IconProps>;
  badge?: string;
  disabled?: boolean;
}

export interface NavCollapsible extends NavLink {
  items: NavLink[];
}

export type NavItem = NavLink | NavCollapsible;

export interface NavGroup {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

export type LinkProps = Omit<NextLinkProps, "href"> & {
  href: string;
  children: React.ReactNode;
};

interface SidebarData {
  teams: Team[];
  navGroups: NavGroup[];
}

export type { SidebarData };
