"use client";

import { HTMLAttributes, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandTwitter,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signupAction } from "@/app/auth/signup/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { useAction } from "next-safe-action/hooks";

import {
  handleEmailPasswordSignIn,
  handleSocialSignIn,
} from "@/lib/firebase/clientAuth";
import { useRouter } from "next/navigation";

interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> {
  defaultEmail?: string;
  isUpgrade?: boolean;
  planType?: string;
  billingCycle?: string;
}

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
});

export function UserAuthForm({
  className,
  defaultEmail = "",
  isUpgrade = false,
  planType,
  billingCycle,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  // Use next-safe-action hook
  const { result } = useAction(signupAction, {
    onSuccess: async (data) => {
      if (data.data?.success) {
        router.push("/welcome");
      }
    },
    onError: (error) => {
      console.error("Action error:", error);
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    handleEmailPasswordSignIn(data.email, data.password)
      .then(() => {
        // If this is an upgrade flow, redirect to upgrade page
        if (isUpgrade) {
          router.push("/upgrade");
        } else {
          router.push("/welcome");
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  // Social sign-in handler that respects upgrade flow
  const handleSocialAuth = async (
    provider: "google" | "facebook" | "twitter" | "github"
  ) => {
    try {
      setIsLoading(true);
      await handleSocialSignIn(provider);

      // Redirect based on whether this is an upgrade flow
      if (isUpgrade) {
        router.push("/upgrade");
      } else {
        router.push("/welcome");
      }
    } catch (error) {
      console.log("error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {result.data?.message ? <p>{result.data.message}</p> : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      {...field}
                      autoComplete="email"
                      data-testid="email-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-muted-foreground hover:opacity-75"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="********"
                      {...field}
                      data-testid="password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="mt-2"
              disabled={isLoading}
              data-testid="signin-button"
            >
              Sign In
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth("google")}
              >
                <IconBrandGoogle className="h-4 w-4" /> Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => handleSocialAuth("facebook")}
              >
                <IconBrandFacebook className="h-4 w-4" /> Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => handleSocialAuth("twitter")}
              >
                <IconBrandTwitter className="h-4 w-4" /> X
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => handleSocialAuth("github")}
              >
                <IconBrandGithub className="h-4 w-4" /> GitHub
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
