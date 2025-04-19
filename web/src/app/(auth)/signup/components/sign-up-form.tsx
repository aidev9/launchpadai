"use client";
import { HTMLAttributes, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandGoogle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { useAction } from "next-safe-action/hooks";
import { signupAction } from "@/app/(auth)/signup/actions";
import {
  handleEmailPasswordSignIn,
  handleSocialSignIn,
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

type SignUpFormProps = HTMLAttributes<HTMLDivElement>;

// Define the form schema
const formSchema = z.object({
  uid: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  photoURL: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  // Optional fields from WaitlistForm
  company: z.string().optional(),
  role: z.string().optional(),
  interest: z.string().optional(),
  phone: z.string().optional(),
  provider: z
    .enum(["email", "google", "facebook", "twitter", "github"])
    .optional(),
});

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uid: "",
      name: "",
      email: "",
      password: "",
      company: "",
      role: "",
      interest: "",
      phone: "",
      provider: "email",
      photoURL: "",
    },
  });

  // Use next-safe-action hook
  const { execute, status, result } = useAction(signupAction, {
    onSuccess: async (data) => {
      if (data.data?.success) {
        // Attempt to sign in the user automatically with their credentials
        try {
          const { email, password } = form.getValues();
          const userCredential = await handleEmailPasswordSignIn(
            email,
            password
          );

          router.push("/dashboard");
        } catch (error) {
          console.error("Error signing in after signup:", error);

          if (error instanceof Error) {
            console.error("Error details:", {
              name: error.name,
              message: error.message,
            });
          }
        }
      } else if (data.data?.message) {
        setErrorMessage(data.data.message);
      }
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    execute(data);
  }

  // Refator this to reduce code duplication
  async function handleGoogleSignIn(): Promise<void> {
    const userCredential = await handleSocialSignIn("google");
    const provider:
      | "google"
      | "email"
      | "facebook"
      | "twitter"
      | "github"
      | undefined = "google";
    const data = {
      uid: userCredential.user.uid,
      email: userCredential.user.email ?? "",
      name: userCredential.user.displayName ?? "",
      photoURL: userCredential.user.photoURL ?? "",
      provider,
      password: "Password123!",
      company: "",
      phone: "",
      role: "other",
      interest: "other",
    };
    const result = await signupAction(data);
    if (result?.data?.success) {
      router.push("/dashboard");
    } else if (result?.data?.message) {
      setErrorMessage(result.data.message);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Name(*)</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email(*)</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="email"
                        placeholder="name@example.com"
                        {...field}
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
                    <FormLabel>Password(*)</FormLabel>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (202) 450-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={status === "executing" || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="product">Product Manager</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={status === "executing" || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="What interests you most?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ai">AI Development</SelectItem>
                        <SelectItem value="productivity">
                          Developer Productivity
                        </SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button className="mt-2" disabled={isLoading}>
              Create Account
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
                onClick={handleGoogleSignIn}
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
