import {
  IconBarrierBlock,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconPackages,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconHelpCircle,
  IconChartPie,
  IconCube,
  IconHome2,
  IconMap,
  IconBook,
  IconDashboard,
  IconUserShield,
  IconSchool,
  IconReportAnalytics,
  IconNotes,
  IconPlaylistAdd,
  IconCreditCard,
  IconStack,
  IconStackPush,
  IconRobot,
  IconRocket,
} from "@tabler/icons-react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LucideCoins,
} from "lucide-react";
import { type SidebarData } from "../types";

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === "development";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "Admin",
      logo: Command,
      plan: "NextJS + ShadcnUI",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "My Launchpad",

      items: [
        {
          title: "My Products",
          url: "/myproducts",
          icon: IconCube,
        },
        {
          title: "My Prompts",
          url: "/myprompts",
          icon: IconPlaylistAdd,
        },
        {
          title: "My Stacks",
          url: "/mystacks",
          icon: IconStack,
        },
        ...(isDev ? [] : []),
        {
          title: "Notes",
          url: "/notes",
          icon: IconMessages,
        },
        {
          title: "Questions",
          url: "/qa",
          icon: IconHelpCircle,
        },
        {
          title: "My Collections",
          url: "/mycollections",
          icon: IconBook,
        },
        {
          title: "My Agents",
          url: "/myagents",
          icon: IconRobot,
        },
      ],
    },
    {
      title: "General",
      items: [
        {
          title: "Product Templates",
          url: "/welcome",
          icon: IconCube,
        },
        {
          title: "Prompt Templates",
          url: "/prompts",
          icon: IconNotes,
        },
        {
          title: "Tools",
          url: "/tools",
          icon: IconTool,
          items: [
            {
              title: "Naming Assistant",
              url: "/tools/naming-assistant",
            },
          ],
        },
        ...(isDev
          ? [
              {
                title: "Analytics",
                url: "/analytics",
                icon: IconChartPie,
              },
              {
                title: "Milestones",
                url: "/milestones",
                icon: IconMap,
              },
              {
                title: "Tasks",
                url: "/tasks",
                icon: IconChecklist,
              },
              {
                title: "Apps",
                url: "/apps",
                icon: IconPackages,
              },
              {
                title: "Chats",
                url: "/chats",
                badge: "3",
                icon: IconMessages,
              },

              {
                title: "Academy",
                url: "/academy",
                icon: IconBook,
              },
            ]
          : []),
      ],
    },
    // Admin section - only shown to admin users
    {
      title: "Admin",
      adminOnly: true,
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: IconDashboard,
        },
        {
          title: "Users",
          url: "/admin/users",
          icon: IconUserShield,
        },
        {
          title: "Feedback",
          url: "/admin/feedback",
          icon: IconMessages,
        },
        {
          title: "Courses",
          url: "/admin/courses",
          icon: IconSchool,
        },
        {
          title: "Prompts",
          url: "/admin/prompts",
          icon: IconNotes,
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
          icon: IconReportAnalytics,
        },
        ...(isDev
          ? [
              {
                title: "Test Questions",
                url: "/test-questions",
                icon: IconBug,
              },
            ]
          : []),
      ],
    },
    {
      title: "Other",
      items: [
        {
          title: "Settings",
          icon: IconSettings,
          url: "/settings",
          items: [
            {
              title: "Profile",
              url: "/settings/profile",
              icon: IconUserCog,
            },
            {
              title: "Account",
              url: "/settings/account",
              icon: IconTool,
            },
            {
              title: "Subscription",
              url: "/settings/subscription",
              icon: IconCreditCard,
            },
            {
              title: "Prompt Credits",
              url: "/settings/prompt-credits",
              icon: LucideCoins,
            },
            {
              title: "Tools",
              url: "/settings/tools",
              icon: IconTool,
            },
            // {
            //   title: "Appearance",
            //   url: "/settings/appearance",
            //   icon: IconPalette,
            // },
            // {
            //   title: "Notifications",
            //   url: "/settings/notifications",
            //   icon: IconNotification,
            // },
            // {
            //   title: "Display",
            //   url: "/settings/display",
            //   icon: IconBrowserCheck,
            // },
          ],
        },
        {
          title: "Help Center",
          url: "/help",
          icon: IconHelp,
        },
        {
          title: "Onboarding",
          url: "/wizard",
          icon: IconRocket,
        },
      ],
    },
    ...(isDev
      ? [
          {
            title: "Pages",
            items: [
              {
                title: "Auth",
                url: "/auth",
                icon: IconLockAccess,
                items: [
                  {
                    title: "Sign In",
                    url: "/auth/signin",
                  },
                  {
                    title: "Sign In (2 Col)",
                    url: "/sign-in-2",
                  },
                  {
                    title: "Sign Up",
                    url: "/auth/signup",
                  },
                  {
                    title: "Forgot Password",
                    url: "/auth/forgot-password",
                  },
                  {
                    title: "OTP",
                    url: "/auth/otp",
                  },
                ],
              },
              {
                title: "Errors",
                url: "/errors",
                icon: IconBug,
                items: [
                  {
                    title: "Unauthorized",
                    url: "/401",
                    icon: IconLock,
                  },
                  {
                    title: "Forbidden",
                    url: "/403",
                    icon: IconUserOff,
                  },
                  {
                    title: "Not Found",
                    url: "/404",
                    icon: IconError404,
                  },
                  {
                    title: "Internal Server Error",
                    url: "/500",
                    icon: IconServerOff,
                  },
                  {
                    title: "Maintenance Error",
                    url: "/503",
                    icon: IconBarrierBlock,
                  },
                ],
              },
            ],
          },
        ]
      : []),
  ],
};
