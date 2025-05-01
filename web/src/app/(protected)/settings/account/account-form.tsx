"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TimezoneSelectField } from "@/components/ui/tz-select";
import {
  AccountUpdateData,
  getAccountAction,
  updateAccountAction,
  resetPasswordAction,
  deleteAccountAction,
} from "./actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAtom } from "jotai";
import {
  accountAtom,
  updateAccountAtom,
  setAccountAtom,
} from "@/lib/store/user-store";
import { SignOutHelper } from "@/lib/firebase/client";

const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" },
] as const;

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  dob: z.date().optional(),
  language: z.string().optional(),
  timezone: z.string({
    required_error: "Please select a time zone.",
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// Missing default values for the form
const defaultValues: Partial<AccountFormValues> = {
  name: "",
  timezone: "",
};

export function AccountForm() {
  const [account] = useAtom(accountAtom);
  const [, updateAccount] = useAtom(updateAccountAtom);
  const [, setAccount] = useAtom(setAccountAtom);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account?.name || "",
      timezone: account?.timezone || "",
      language: account?.language || undefined,
      dob: account?.dob,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialogRef = useRef(null);
  // Call the hook at component level, not inside the event handler
  const signOutAndClearProfile = SignOutHelper();

  async function onSubmit(data: AccountFormValues) {
    try {
      setIsSubmitting(true);
      const prevAccount = { ...account };
      // Optimistically update atom
      updateAccount(data);
      // Submit the form data to the server action
      const response = await updateAccountAction(data as AccountUpdateData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Your account settings have been updated",
        });
      } else {
        if (prevAccount) updateAccount(prevAccount);
        toast({
          title: "Error",
          description: response.error || "Failed to update account settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (account) updateAccount(account);
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setIsResetting(true);
    try {
      const response = await resetPasswordAction();
      if (response.success) {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a password reset link.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send password reset email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const response = await deleteAccountAction();
      if (response && response.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted.",
        });
        // Sign out the user from Firebase and clear session, then redirect
        await signOutAndClearProfile(router);
        return;
      } else {
        toast({
          title: "Error",
          description: response?.error || "Failed to delete account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  useEffect(() => {
    if (!account) {
      getAccountAction().then((result) => {
        if (result.success && result.account) {
          setAccount(result.account);
          form.reset({
            name: result.account.name || "",
            timezone: result.account.timezone || "",
            language: result.account.language || undefined,
            dob: result.account.dob,
          });
        }
      });
    }
  }, [account, setAccount, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Time Zone</FormLabel>
              <TimezoneSelectField
                value={field.value}
                onChange={field.onChange}
                className="w-[300px]"
              />
              <FormDescription>
                Select your local time zone for accurate scheduling.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update account"}
        </Button>

        {/* Reset Password Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold mb-2">Reset Password</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Send a password reset email to your account email address.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetPassword}
            disabled={isResetting}
          >
            {isResetting ? "Sending..." : "Send Password Reset Email"}
          </Button>
        </div>
        {/* Delete Account Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This action is{" "}
            <span className="font-bold text-destructive">irreversible</span>.
            Your account will be deleted and cannot be recovered.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            Delete Account
          </Button>
        </div>
        <div className="h-4" />
      </form>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent ref={deleteDialogRef}>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
