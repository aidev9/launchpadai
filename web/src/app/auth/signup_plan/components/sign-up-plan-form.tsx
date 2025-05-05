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
import { SubscriptionPlan } from "@/stores/subscriptionStore";
import { createSubscriptionAction } from "@/app/auth/signup_plan/actions";

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
  const [customerId, setCustomerId] = useState<string | null>(null); // Add customerId state
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

  // Initialize payment intent when form is valid
  useEffect(() => {
    // Only proceed if we're on the payment tab and don't already have a client secret
    if (activeTab === "payment" && !clientSecret && form.formState.isValid) {
      const createIntent = async () => {
        try {
          setIsLoading(true);

          // Get form data
          const data = form.getValues();

          // Create a payment intent on the server
          const response = await fetch("/api/stripe/create-payment-intent", {
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
            setCustomerId(responseData.customerId); // Store the customerId
          }
        } catch (err) {
          setError("Failed to initialize payment. Please try again.");
          console.error("Payment intent creation error:", err);
        } finally {
          setIsLoading(false);
        }
      };

      createIntent();
    }
  }, [activeTab, clientSecret, form, plan]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (activeTab === "account") {
      // Move to payment tab after account info is completed
      setActiveTab("payment");
    }
  };

  // Handle payment success - updated to accept customerId
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

      // Create user account and subscription
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
        paymentMethodId: paymentIntent.payment_method,
        stripeCustomerId: stripeCustomerId, // Pass the existing customerId
      });

      if (result?.data?.success) {
        // Redirect to FTUX
        router.push("/ftux");
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
