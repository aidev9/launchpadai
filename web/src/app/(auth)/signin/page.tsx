import { Card } from "@/components/ui/card";
import AuthLayout from "../auth-layout";
import { UserAuthForm } from "./components/user-auth-form";
import Link from "next/link";

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href={"/signup"}
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign Up
            </Link>
          </p>
        </div>
        <UserAuthForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          By clicking Sign In, you agree to our{" "}
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
      </Card>
    </AuthLayout>
  );
}
