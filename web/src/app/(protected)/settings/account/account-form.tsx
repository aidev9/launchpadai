"use client";
import { z } from "zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { CalendarIcon, CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimezoneSelectField } from "@/components/ui/tz-select";
import {
  AccountUpdateData,
  getAccountAction,
  updateAccountAction,
} from "./actions";
import { useAtom } from "jotai";
import { accountAtom, updateAccountAtom, setAccountAtom } from "@/lib/store/user-store";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        {/* <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "MMM d, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date: Date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        {/* <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Language</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? languages.find(
                            (language) => language.value === field.value
                          )?.label
                        : "Select language"}
                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              form.setValue("language", language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                language.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}
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
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Updating..." : "Update account"}
        </Button>
        <div className="h-4" />
      </form>
    </Form>
  );
}
