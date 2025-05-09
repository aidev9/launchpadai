"use client";

import { useState } from "react";
import { Main } from "@/components/layout/main";
import { UsersTable } from "./components/users-table";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import {
  inviteDialogOpenAtom,
  deleteDialogOpenAtom,
  selectedUsersAtom,
  usersAtom,
  rowSelectionAtom,
} from "./users-store";
import { InviteUserDialog } from "./components/invite-user-dialog";
import { DeleteUserDialog } from "./components/delete-user-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "./actions/delete";

export default function UsersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useAtom(inviteDialogOpenAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useAtom(deleteDialogOpenAtom);
  const [selectedUsers] = useAtom(selectedUsersAtom);
  const [users, setUsers] = useAtom(usersAtom);
  const [, setRowSelection] = useAtom(rowSelectionAtom);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Handle deletion of selected users
  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;

    // Close the dialog immediately to prevent flickering
    setDeleteDialogOpen(false);

    setIsDeleting(true);
    try {
      let successCount = 0;
      let failedCount = 0;
      const successfullyDeletedIds: string[] = [];

      // Delete users one by one
      for (const userId of selectedUsers) {
        try {
          const result = await deleteUser(userId);
          if (result.success) {
            successCount++;
            successfullyDeletedIds.push(userId);
          } else {
            failedCount++;
            console.error(`Failed to delete user ${userId}: ${result.error}`);
          }
        } catch (err) {
          failedCount++;
          console.error(`Error deleting user ${userId}:`, err);
        }
      }

      // Update the UI based on the results
      if (successCount > 0) {
        // Update users state to remove deleted users
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !successfullyDeletedIds.includes(user.uid))
        );

        // Clear row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Users deleted",
          description: `Successfully deleted ${successCount} ${
            successCount === 1 ? "user" : "users"
          }${
            failedCount > 0
              ? `. Failed to delete ${failedCount} ${
                  failedCount === 1 ? "user" : "users"
                }.`
              : ""
          }`,
        });
      } else {
        // Show warning but don't treat it as a complete failure
        toast({
          title: "Warning",
          description:
            "Some users may not have been completely deleted. The user list has been updated with successfully deleted users.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting users",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      // Dialog is already closed at this point
    }
  };

  const hasSelectedUsers = selectedUsers.length > 0;

  // Debug logging
  console.log("Page component - selectedUsers:", selectedUsers);
  console.log("Page component - hasSelectedUsers:", hasSelectedUsers);

  return (
    <Main>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View, manage, and invite users to your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelectedUsers && (
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
              {selectedUsers.length > 0 && ` (${selectedUsers.length})`}
            </Button>
          )}
          <Button onClick={() => setInviteDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      <UsersTable />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeleteUsers}
        isDeleting={isDeleting}
      />
    </Main>
  );
}
