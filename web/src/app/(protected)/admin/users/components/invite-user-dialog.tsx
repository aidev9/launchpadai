"use client";

import { useState, useEffect } from "react";
import { InvitationViewer } from "./invitation-viewer";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom } from "jotai";
import { currentUserAtom } from "../users-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { inviteUser } from "../actions/invite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subscription: z.string().min(1, "Subscription level is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function InviteUserDialog({
  open,
  onOpenChange,
}: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);
  const { toast } = useToast();

  const [currentUser] = useAtom(currentUserAtom);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subscription: "free",
    },
  });

  // Pre-populate form with current user data if available
  useEffect(() => {
    if (currentUser && open) {
      form.setValue("name", currentUser.displayName || "");
      form.setValue("email", currentUser.email || "");

      // Set subscription based on current user data
      if (currentUser.subscription) {
        if (typeof currentUser.subscription === "string") {
          form.setValue("subscription", currentUser.subscription);
        } else if (typeof currentUser.subscription === "object") {
          // Use type assertion to safely access properties
          const subObj = currentUser.subscription as any;
          if (subObj.planType) {
            form.setValue("subscription", subObj.planType);
          }
        }
      }
    }
  }, [currentUser, open, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const result = await inviteUser(
        values.email,
        values.name,
        values.subscription
      );

      if (result.success) {
        toast({
          title: "User invited successfully",
          description: `An invitation has been created for ${values.email}`,
        });

        // Store the email and show the invitation viewer
        setInvitedEmail(values.email);
        setShowInvitation(true);

        form.reset();
      } else {
        toast({
          title: "Failed to invite user",
          description: result.error || "Something went wrong",
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
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // Reset the invitation viewer when closing the dialog
        if (!value) {
          setShowInvitation(false);
          setInvitedEmail(null);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className={showInvitation ? "sm:max-w-md" : ""}>
        {!showInvitation ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite a new user</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new user to the platform.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subscription level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="explorer">Explorer</SelectItem>
                          <SelectItem value="builder">Builder</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Invite User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>User Invitation</DialogTitle>
              <DialogDescription>
                The user has been invited. You can share this link with them.
              </DialogDescription>
            </DialogHeader>

            {invitedEmail && <InvitationViewer email={invitedEmail} />}

            <DialogFooter className="mt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
