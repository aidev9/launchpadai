import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAtom } from "jotai";
import { userProfileAtom, accountAtom } from "@/lib/store/user-store";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbackInput, feedbackSchema } from "@/lib/firebase/schema";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "bug" | "feature" | "comment";
  onSubmit: (data: FeedbackInput) => Promise<void>;
  isSubmitting: boolean;
}

export function FeedbackModal({
  open,
  onOpenChange,
  type,
  onSubmit,
  isSubmitting,
}: FeedbackModalProps) {
  const [userProfile] = useAtom(userProfileAtom);
  const [accountSettings] = useAtom(accountAtom);

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: accountSettings?.name || userProfile?.displayName || "",
      type: type,
      subject: "",
      body: "",
    },
  });

  // Update form values when type, userProfile, or accountSettings changes
  useEffect(() => {
    form.setValue("type", type);

    // Update name when userProfile or accountSettings changes
    if (accountSettings?.name) {
      form.setValue("name", accountSettings.name);
    } else if (userProfile?.displayName) {
      form.setValue("name", userProfile.displayName);
    }
  }, [type, userProfile, accountSettings, form]);

  const handleSubmit = async (data: FeedbackInput) => {
    await onSubmit(data);
    form.reset();
  };

  const getModalTitle = () => {
    switch (type) {
      case "bug":
        return "Report a Bug";
      case "feature":
        return "Submit Feedback";
      case "comment":
        return "Contact Us";
      default:
        return "Submit Feedback";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit your{" "}
            {type === "bug"
              ? "bug report"
              : type === "feature"
                ? "feedback"
                : "message"}
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="comment">General Comment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[120px]"
                      placeholder="Please provide details..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
