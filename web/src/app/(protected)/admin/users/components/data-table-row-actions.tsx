"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { UserProfile } from "@/lib/firebase/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currentUserAtom, inviteDialogOpenAtom } from "../users-store";
import { Eye, PenSquare, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "../actions/delete";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface DataTableRowActionsProps {
  row: Row<UserProfile>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const router = useRouter();
  const user = row.original;

  const setCurrentUser = useSetAtom(currentUserAtom);
  const setInviteDialogOpen = useSetAtom(inviteDialogOpenAtom);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleView = () => {
    // Set the selected user in the atom before navigating
    setCurrentUser(user);
    router.push(`/admin/users/user`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    toast({
      title: "Edit user",
      description: "Edit functionality not yet implemented",
    });
  };

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event

    // Set the current user to pre-populate the invite form
    setCurrentUser(user);

    // Open the invite dialog
    setInviteDialogOpen(true);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    // Make sure the event doesn't bubble up to the row click handler
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Close the dialog immediately to prevent flickering
    setDeleteDialogOpen(false);

    try {
      setIsDeleting(true);
      const result = await deleteUser(user.uid);

      if (result.success) {
        toast({
          title: "User deleted",
          description: `${user.displayName || user.email} has been deleted successfully.`,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Refresh the page to update the user list
        // In a real implementation, we would use a state management approach
        // similar to the courses implementation
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Show error but don't throw
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: `Failed to delete user: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <PenSquare className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInvite}>
            <UserPlus className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Invite User
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          // When closing the dialog, prevent row click events
          if (!open) {
            // Using setTimeout to ensure this executes after the current event cycle
            setTimeout(() => setDeleteDialogOpen(false), 0);
          } else {
            setDeleteDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{user.displayName || user.email}
              "? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => handleDelete(e)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
