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
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    // Add a small delay to ensure all parameters are loaded
    setTimeout(() => {
      try {
        // Get the email from URL parameters
        const emailFromUrl = searchParams.get("email");
        const mockInvite = searchParams.get("mockInvite");
        const fallback = searchParams.get("fallback");
        const oobCode = searchParams.get("oobCode");
        
        // Log the URL and parameters for debugging
        console.log("Complete signup parameters:", {
          email: emailFromUrl,
          mockInvite,
          fallback,
          oobCode: oobCode ? "[present]" : "[missing]",
          fullUrl: window.location.href
        });
        
        // Always proceed if we have an email (either mock invite or real invite)
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
      } catch (error) {
        console.error("Error processing sign-in link:", error);
        toast({
          title: "Error",
          description: "An error occurred while processing your invitation link",
          variant: "destructive",
        });
        router.push("/auth/signin");
      }
    }, 500); // Small delay to ensure URL parameters are fully loaded
  }, [auth, router, searchParams, toast]);

  async function onSubmit(values: FormValues) {
    if (!email) return;

    setIsSubmitting(true);

    try {
      // Check for parameters
      const mockInvite = searchParams.get("mockInvite");
      const fallback = searchParams.get("fallback");
      const oobCode = searchParams.get("oobCode");
      
      console.log("Processing signup submission for:", email);
      
      // We need to handle the user creation differently based on the invitation type
      let userId;
      
      // For mock or fallback invitations, we'll look up the user in Firestore
      if (mockInvite === "true" || fallback === "true") {
        console.log("Processing mock/fallback invitation");
        
        // Try to find the user in Firestore by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userId = querySnapshot.docs[0].id;
          console.log("Found existing user in Firestore:", userId);
        } else {
          console.error("User not found in Firestore");
          throw new Error("User not found. Please contact support.");
        }
      } else {
        // Regular email link sign in
        try {
          console.log("Attempting to sign in with email link");
          const result = await signInWithEmailLink(
            auth,
            email,
            window.location.href
          );
          
          if (result.user) {
            userId = result.user.uid;
            console.log("User authenticated successfully:", userId);
            
            // Update password
            console.log("Updating password");
            await updatePassword(result.user, values.password);
          } else {
            throw new Error("Authentication failed");
          }
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          
          // Special handling for invalid action code
          if (authError.code === "auth/invalid-action-code") {
            throw new Error("This invitation link has expired or is invalid. Please request a new invitation.");
          }
          
          throw authError;
        }
      }

      // Update user document in Firestore if we have a userId
      if (userId) {
        console.log("Updating user document in Firestore");
        const userRef = doc(db, "users", userId);

        // First check if the document exists
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          // Update existing document
          await updateDoc(userRef, {
            emailVerified: true,
            updatedAt: getCurrentUnixTimestamp(),
            // For mock invitations, we need to set the password separately
            ...(mockInvite === "true" || fallback === "true" ? { password: values.password } : {})
          });
        } else {
          // Create new document
          await setDoc(userRef, {
            email: email,
            emailVerified: true,
            createdAt: getCurrentUnixTimestamp(),
            updatedAt: getCurrentUnixTimestamp(),
            // For mock invitations, we need to set the password separately
            ...(mockInvite === "true" || fallback === "true" ? { password: values.password } : {})
          });

          // Initialize prompt credits with free plan for new users
          await initializeUserPromptCredits({
            userId: userId,
            planType: "free",
          });
        }

        // Revoke all refresh tokens to invalidate any existing email action codes
        await revokeUserTokens(userId);

        // Show success message
        toast({
          title: "Success",
          description: "Your account has been set up successfully!",
        });

        // Redirect to dashboard
        router.push("/welcome");
      } else {
        throw new Error("Failed to process your account setup. Please contact support.");
      }
    } catch (error: any) {
      console.error("Error completing signup:", error);

      // Special handling for different error types
      if (error.code === "auth/invalid-action-code") {
        toast({
          title: "Invalid Invitation Link",
          description: "This invitation link has expired or is invalid. Please request a new invitation.",
          variant: "destructive",
        });
      } else if (error.message?.includes("client is offline")) {
        toast({
          title: "Connection Error",
          description: "Please check your internet connection and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
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
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
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
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
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
