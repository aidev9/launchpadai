import { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Sign Up - LaunchpadAI',
  description:
    'Create your account on LaunchpadAI and start using our AI tools.',
}

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md mx-auto bg-white rounded-xl p-8 shadow-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-gray-600 mt-2">
              Join LaunchpadAI to get started with our AI tools
            </p>
          </div>

          <SignupForm />

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
