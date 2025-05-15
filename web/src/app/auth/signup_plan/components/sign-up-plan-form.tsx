"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentForm } from "@/components/stripe/payment-form";
import { SubscriptionPlan } from "@/lib/firebase/schema";
import { createSubscriptionAction, checkEmailExists } from "../actions";
import { handleEmailPasswordSignIn } from "@/lib/firebase/clientAuth";
import Link from "next/link";
import { set } from "nprogress";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  company: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
});

interface SignUpPlanFormProps {
  plan: SubscriptionPlan;
}

export function SignUpPlanForm({ plan }: SignUpPlanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      company: "",
      role: "",
      phone: "",
    },
  });

  // Initialize subscription when form is valid
  useEffect(() => {
    // Only proceed if we're on the payment tab and don't already have a client secret
    if (activeTab === "payment" && !clientSecret && form.formState.isValid) {
      const createSubscription = async () => {
        try {
          setIsLoading(true);

          // Get form data
          const data = form.getValues();

          // Create a subscription on the server
          const response = await fetch("/api/stripe/create-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              plan: plan.planType,
              billingCycle: plan.billingCycle,
              price: plan.price,
              email: data.email,
              name: data.name,
            }),
          });

          const responseData = await response.json();

          if (responseData.error) {
            setError(responseData.error);
          } else {
            setClientSecret(responseData.clientSecret);
            setCustomerId(responseData.customerId);
            setSubscriptionId(responseData.subscriptionId);
          }
        } catch (err) {
          setError("Failed to initialize subscription. Please try again.");
          console.error("Subscription creation error:", err);
        } finally {
          setIsLoading(false);
        }
      };

      createSubscription();
    }
  }, [activeTab, clientSecret, form, plan]);

  // useEffect for errors
  useEffect(() => {
    if (error) {
      setError(error);
      setIsLoading(true);
    }
  }, [error]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (activeTab === "account") {
      // Check if email already exists before proceeding to payment
      setIsLoading(true);

      try {
        // Use the server action to check if email exists
        const result = await checkEmailExists({
          email: data.email,
        });

        if (result?.data?.data?.exists === true) {
          setError(
            "This email is already in use. Please try another email or sign in to continue."
          );
          // Optionally set form error for the email field
          form.setError("email", {
            type: "manual",
            message: "This email is already in use.",
          });
        } else {
          setError(null); // Clear global error if email is okay
          setIsLoading(false); // Reset loading state
        }

        // Email doesn't exist, proceed to payment tab
        setActiveTab("payment");
      } catch (err) {
        setError(
          "An error occurred while checking your email. Please try again."
        );
        console.error("Email check error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle payment success - updated to work with subscription flow
  const handlePaymentSuccess = async (
    paymentIntent: any,
    stripeCustomerId: string
  ) => {
    try {
      setIsLoading(true);

      // Get form data
      const data = form.getValues();

      // Extract only the allowed plan types for the action
      const allowedPlanType =
        plan.planType === "Free"
          ? "Explorer"
          : (plan.planType as "Explorer" | "Builder" | "Accelerator");

      // Create user account and link to subscription
      const result = await createSubscriptionAction({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company || "",
        role: data.role || "",
        phone: data.phone || "",
        planType: allowedPlanType,
        billingCycle: plan.billingCycle,
        price: plan.price,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: subscriptionId || "",
      });

      if (result?.data?.success) {
        // Sign in the user on the client-side before redirecting
        try {
          await handleEmailPasswordSignIn(data.email, data.password);
          // Redirect to FTUX after successful sign-in
          router.push("/welcome");
        } catch (signInError) {
          console.error(
            "Error signing in after account creation:",
            signInError
          );
          // Show error but still navigate to sign-in page as fallback
          setError(
            "Account created, but couldn't log in automatically. Please sign in manually."
          );
          setTimeout(() => {
            router.push(`/auth/signin?email=${encodeURIComponent(data.email)}`);
          }, 2000);
        }
      } else {
        setError(result?.data?.error || "Failed to create account");
      }
    } catch (err) {
      setError("An error occurred during signup");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger
          value="account"
          disabled={activeTab === "payment" && !form.formState.isValid}
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="payment"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
        >
          Payment
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-4">
        {error && (
          <div className="mb-4 py-3 text-sm rounded">
            <div className="mb-4 p-3 text-sm text-white bg-destructive rounded">
              {error}
            </div>
            <Link
              href="/auth/signin?upgrade"
              className="text-sm hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name*</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="John Doe"
                      {...field}
                      data-testid="name-input"
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
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="email"
                        placeholder="name@example.com"
                        {...field}
                        data-testid="email-input"
                        onBlur={async (e) => {
                          field.onBlur(); // Call the original onBlur from react-hook-form
                          console.log("e", e.target.value);
                          // Only check email if the field is valid so far
                          if (
                            e.target.value &&
                            !form.getFieldState("email").invalid
                          ) {
                            setIsLoading(true); // Set loading state for email check
                            try {
                              const result = await checkEmailExists({
                                email: e.target.value,
                              });
                              console.log("result", result);
                              // Check the structure of the result correctly
                              if (result?.data?.data?.exists === true) {
                                setError(
                                  "This email is already in use. Please try another email or sign in to continue."
                                );
                                // Optionally set form error for the email field
                                form.setError("email", {
                                  type: "manual",
                                  message: "This email is already in use.",
                                });
                              } else {
                                setError(null); // Clear global error if email is okay
                                setIsLoading(false); // Reset loading state
                                // Clear potential previous manual error if email is now valid
                                if (
                                  form.getFieldState("email").error?.type ===
                                  "manual"
                                ) {
                                  form.clearErrors("email");
                                }
                              }
                            } catch (err) {
                              console.error("Email check failed:", err);
                              setError(
                                "Failed to verify email. Please try again."
                              );
                            } finally {
                              setIsLoading(false); // Reset loading state after check
                            }
                          } else {
                            // If field is invalid or empty, clear previous custom errors but let RHF handle validation messages
                            if (
                              form.getFieldState("email").error?.type ===
                              "manual"
                            ) {
                              form.clearErrors("email");
                            }
                            setError(null); // Clear global error if field is invalid/empty
                          }
                        }}
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
                  <FormItem>
                    <FormLabel>Password*</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="********"
                        {...field}
                        data-testid="password-input"
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
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (202) 450-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
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

            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid || isLoading}
              data-testid="signup-plan-button"
            >
              {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="payment" className="mt-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Subscription Summary</h3>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Plan:</span>
              <span className="font-medium">{plan.planType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Billing:</span>
              <span className="font-medium">
                {plan.billingCycle === "annual" ? "Annual" : "Monthly"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Price:</span>
              <span className="font-medium">
                ${plan.price}/
                {plan.billingCycle === "annual" ? "year" : "month"}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-white bg-destructive rounded">
            {error}
          </div>
        )}

        {clientSecret && customerId ? (
          <Elements stripe={getStripe()} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              customerId={customerId}
              processing={isLoading}
              setProcessing={setIsLoading}
              onError={(error) => setError(error)}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center p-6">
            {isLoading
              ? "Loading payment form..."
              : "Complete account details to proceed"}
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setActiveTab("account")}
            disabled={isLoading}
          >
            Back to Account Details
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
