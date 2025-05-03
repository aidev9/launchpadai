"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Form schemas
const generalSettingsSchema = z.object({
  siteName: z
    .string()
    .min(2, { message: "Site name must be at least 2 characters." }),
  siteUrl: z.string().url({ message: "Please enter a valid URL." }),
  adminEmail: z.string().email({ message: "Please enter a valid email." }),
});

// Fix: Ensure requireMfa is explicitly defined as boolean without default
const securitySettingsSchema = z.object({
  requireMfa: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  passwordPolicy: z.enum(["basic", "medium", "strong"]),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  // General settings form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "LaunchpadAI",
      siteUrl: "https://launchpadai.io",
      adminEmail: "admin@launchpadai.io",
    },
  });

  // Security settings form
  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      requireMfa: true,
      sessionTimeout: 60,
      passwordPolicy: "medium",
    },
  });

  function onGeneralSubmit(data: GeneralSettingsValues) {
    // In a real app, this would send to API
    console.log("General settings submitted:", data);
    toast({
      title: "Settings saved",
      duration: TOAST_DEFAULT_DURATION,
      description: "General settings have been updated successfully.",
    });
  }

  const onSecuritySubmit: (data: SecuritySettingsValues) => void = (data) => {
    // In a real app, this would send to API
    console.log("Security settings submitted:", data);
    toast({
      title: "Settings saved",
      duration: TOAST_DEFAULT_DURATION,
      description: "Security settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings for the platform
        </p>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general platform settings and information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form
                    onSubmit={generalForm.handleSubmit(onGeneralSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your platform shown to users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="siteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The URL of your platform.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Email address for system notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Save General Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security options and policies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form
                    onSubmit={securityForm.handleSubmit(onSecuritySubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={securityForm.control}
                      name="requireMfa"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Require Multi-Factor Authentication
                            </FormLabel>
                            <FormDescription>
                              Enforce MFA for all admin users.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Time before users are automatically logged out due
                            to inactivity.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password Policy</FormLabel>
                          <div className="space-y-4">
                            <FormControl>
                              <div className="flex flex-col space-y-2">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    checked={field.value === "basic"}
                                    onChange={() => field.onChange("basic")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span>Basic (8+ chars)</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    checked={field.value === "medium"}
                                    onChange={() => field.onChange("medium")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span>
                                    Medium (8+ chars, 1+ number, 1+ uppercase)
                                  </span>
                                </label>

                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    checked={field.value === "strong"}
                                    onChange={() => field.onChange("strong")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span>
                                    Strong (12+ chars, numbers, uppercase,
                                    special chars)
                                  </span>
                                </label>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Save Security Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
