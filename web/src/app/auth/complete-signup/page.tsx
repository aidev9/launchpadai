"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
} from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { clientAuth, clientDb } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { revokeUserTokens, initializeUserPromptCredits } from "../actions";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

// Client component that uses useSearchParams
function CompleteSignupContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = clientAuth;
  const db = clientDb;
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if the URL contains a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from URL parameters
      const emailFromUrl = searchParams.get("email");

      if (emailFromUrl) {
        setEmail(emailFromUrl);
        setIsLoading(false);
      } else {
        // If email is not available in URL, prompt user to provide it
        const userEmail = window.prompt(
          "Please provide your email for confirmation"
        );

        if (userEmail) {
          setEmail(userEmail);
          setIsLoading(false);
        } else {
          // User cancelled the prompt
          toast({
            title: "Error",
            description: "Email is required to complete signup",
            variant: "destructive",
          });
          router.push("/auth/signin");
        }
      }
    } else {
      // If not a sign-in link, redirect to sign-in page
      toast({
        title: "Invalid link",
        description: "The link you clicked is invalid or has expired",
        variant: "destructive",
      });
      router.push("/auth/signin");
    }
  }, [auth, router, searchParams, toast]);

  async function onSubmit(values: FormValues) {
    if (!email) return;

    setIsSubmitting(true);

    try {
      // Sign in with email link
      console.log("Attempting to sign in with email link:", email);
      const result = await signInWithEmailLink(
        auth,
        email,
        window.location.href
      );

      // Update password
      if (result.user) {
        console.log("User authenticated, updating password");
        await updatePassword(result.user, values.password);

        // Update user document in Firestore
        console.log("Updating user document in Firestore");
        const userRef = doc(db, "users", result.user.uid);

        // First check if the document exists
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          // Update existing document
          await updateDoc(userRef, {
            emailVerified: true,
            updatedAt: getCurrentUnixTimestamp(),
          });
        } else {
          // Create new document
          await setDoc(userRef, {
            email: result.user.email,
            emailVerified: true,
            createdAt: getCurrentUnixTimestamp(),
            updatedAt: getCurrentUnixTimestamp(),
          });

          // Initialize prompt credits with free plan for new users
          await initializeUserPromptCredits({
            userId: result.user.uid,
            planType: "free",
          });
        }

        // Revoke all refresh tokens to invalidate any existing email action codes
        await revokeUserTokens(result.user.uid);

        // Redirect to dashboard
        router.push("/welcome");
      }
    } catch (error: any) {
      console.error("Error completing signup:", error);

      // Special handling for offline error
      if (error.message?.includes("client is offline")) {
        toast({
          title: "Connection Error",
          description: "Please check your internet connection and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="text-xl font-medium">LaunchpadAI</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Signup</CardTitle>
          <CardDescription>
            Create a password to finish setting up your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input value={email || ""} disabled />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  "Complete Signup"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By completing signup, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CompleteSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CompleteSignupContent />
    </Suspense>
  );
}
