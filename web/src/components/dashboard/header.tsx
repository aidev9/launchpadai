"use client";
import { useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Menu, Search } from "lucide-react";
import { IconMessages } from "@tabler/icons-react";
import { FeedbackModal } from "@/app/(protected)/help/components/feedback-modal";
import { useCreateFeedback } from "@/hooks/useFeedback";
import { FeedbackInput } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center gap-4 md:gap-6">
          <div className="relative hidden flex-1 md:flex">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://randomuser.me/api/portraits/men/12.jpg"
                      alt="User"
                    />
                    <AvatarFallback>SN</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
        </div>
      </header>
      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={feedbackType}
        onSubmit={handleSubmitFeedback}
        isSubmitting={createFeedbackMutation.isPending}
      />
    </>
  );
}
