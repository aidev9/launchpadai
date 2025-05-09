"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FeedbackModal } from "@/app/(protected)/help/components/feedback-modal";
import { useCreateFeedback } from "@/hooks/useFeedback";
import { FeedbackInput } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";
import {
  LayoutDashboard,
  CheckSquare,
  AppWindow,
  MessageSquare,
  Users,
  UserCircle,
  AlertCircle,
  HelpCircle,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "General",
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    group: "General",
  },
  {
    title: "Apps",
    href: "/dashboard/apps",
    icon: AppWindow,
    group: "General",
  },
  {
    title: "Chats",
    href: "/dashboard/chats",
    icon: MessageSquare,
    badge: "3",
    group: "General",
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    group: "General",
  },
  {
    title: "Auth",
    href: "/dashboard/auth",
    icon: UserCircle,
    group: "Pages",
    children: [
      {
        title: "Sign In",
        href: "/dashboard/auth/signin",
      },
      {
        title: "Sign In (2 Col)",
        href: "/dashboard/auth/sign-in-2col",
      },
      {
        title: "Sign Up",
        href: "/dashboard/auth/signup",
      },
      {
        title: "Forgot Password",
        href: "/dashboard/auth/forgot-password",
      },
      {
        title: "OTP",
        href: "/dashboard/auth/otp",
      },
    ],
  },
  {
    title: "Errors",
    href: "/dashboard/errors",
    icon: AlertCircle,
    group: "Pages",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    group: "Other",
  },
  {
    title: "Help Center",
    href: "/help",
    icon: HelpCircle,
    group: "Other",
  },
  {
    title: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
    group: "Admin",
  },
];

const teams = [
  {
    id: "1",
    name: "Admin",
    description: "NextJS + ShadcnUI",
    icon: "S",
  },
  {
    id: "2",
    name: "Acme Inc",
    description: "",
    icon: "A",
  },
  {
    id: "3",
    name: "Acme Corp.",
    description: "",
    icon: "A",
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(teams[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "bug" | "feature" | "comment"
  >("feature");
  const createFeedbackMutation = useCreateFeedback();
  const { toast } = useToast();
  const [userProfile] = useAtom(userProfileAtom);

  const handleOpenFeedback = () => {
    setFeedbackType("feature");
    setModalOpen(true);
  };

  const handleSubmitFeedback = async (data: FeedbackInput) => {
    try {
      const userId = userProfile?.uid || "unknown";
      const userEmail = userProfile?.email || "unknown@example.com";

      await createFeedbackMutation.mutateAsync({
        data,
        userId,
        userEmail,
      });

      setModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Group items by their group property
  const groupedItems = sidebarNavItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof sidebarNavItems>
  );

  return (
    <div
      className={cn("flex flex-col h-full border-r bg-background", className)}
      {...props}
    >
      {/* Team Selector */}
      <div className="px-3 py-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-xl">
                    {selectedTeam.icon}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">
                    {selectedTeam.name}
                  </div>
                  {selectedTeam.description && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {selectedTeam.description}
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                className="py-2"
                onSelect={() => setSelectedTeam(team)}
              >
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-gray-900 flex items-center justify-center">
                    <span className="text-white text-xl">{team.icon}</span>
                  </div>
                  <div className="text-sm font-medium">{team.name}</div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add team</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 py-2">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="px-3 py-2">
              <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight uppercase text-muted-foreground">
                {group}
              </h3>
              <div className="space-y-1">
                {items.map((item) =>
                  item.children ? (
                    <Collapsible
                      key={item.href}
                      open={open}
                      onOpenChange={setOpen}
                      className="w-full"
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            pathname.startsWith(item.href)
                              ? "bg-accent text-accent-foreground"
                              : "transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              open && "transform rotate-180"
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-8 pl-2 border-l">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center py-2 text-sm hover:text-foreground",
                              pathname === child.href
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="mt-auto border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://randomuser.me/api/portraits/women/42.jpg"
                    alt="satnaing"
                  />
                  <AvatarFallback>SN</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium">satnaing</div>
                  <div className="text-xs text-muted-foreground">
                    user@email.com
                  </div>
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">satnaing</p>
                <p className="text-xs text-muted-foreground">
                  satnaingdev@gmail.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleOpenFeedback}>
              Send Feedback
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/upgrade">Upgrade</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={feedbackType}
        onSubmit={handleSubmitFeedback}
        isSubmitting={createFeedbackMutation.isPending}
      />
    </div>
  );
}
