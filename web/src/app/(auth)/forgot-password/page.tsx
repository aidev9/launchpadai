import { Metadata } from 'next'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password | LaunchpadAI',
  description:
    'Reset your password to regain access to your LaunchpadAI account',
}

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md w-full mx-auto px-4 py-8">
      <div className="space-y-4 text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  )
}
