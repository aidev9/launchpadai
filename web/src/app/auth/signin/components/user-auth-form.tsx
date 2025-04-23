"use client";

import { HTMLAttributes, startTransition, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
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
import { clientAuth } from "@/lib/firebase/client";

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>;

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

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Use next-safe-action hook
  const { execute, status, result } = useAction(signupAction, {
    onSuccess: async (data) => {
      if (data.data?.success) {
        router.push("/(protected)/ftux");
      }
    },
    onError: (error) => {
      console.error("Action error:", error);
      setErrorMessage(
        error?.error?.serverError || "An error occurred. Please try again."
      );
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    handleEmailPasswordSignIn(data.email, data.password)
      .then(() => {
        router.push("/(protected)/ftux");
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setErrorMessage(
          error?.message || "An error occurred. Please try again."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });

    setErrorMessage(null);
    setSuccessMessage(null);
  }

  useEffect(() => {
    onAuthStateChanged(clientAuth, (user) => {
      if (user) {
        const provider:
          | "google"
          | "email"
          | "facebook"
          | "twitter"
          | "github"
          | undefined = "google";

        const data = {
          uid: user.uid,
          email: user.email ?? "",
          name: user.displayName ?? "",
          photoURL: user.photoURL ?? "",
          provider,
          password: "Password123!",
          company: "",
          phone: "",
          role: "other",
          interest: "other",
        };
        execute(data);
        router.push("/(protected)/ftux");
      } else {
        console.log("No user is signed in.");
      }
    });
  }, []);

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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="mt-2" disabled={isLoading}>
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
                onClick={async () => handleSocialSignIn("google")}
              >
                <IconBrandGoogle className="h-4 w-4" /> Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => {
                  handleSocialSignIn("facebook");
                }}
              >
                <IconBrandFacebook className="h-4 w-4" /> Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => {
                  handleSocialSignIn("twitter");
                }}
              >
                <IconBrandTwitter className="h-4 w-4" /> X
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                disabled={true || isLoading}
                onClick={() => {
                  handleSocialSignIn("github");
                }}
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
