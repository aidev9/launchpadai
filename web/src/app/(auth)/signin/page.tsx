import { Metadata } from 'next'
import SigninForm from './SigninForm'

export const metadata: Metadata = {
  title: 'Sign In - LaunchpadAI',
  description: 'Sign in to your LaunchpadAI account.',
}

export default function SigninPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md mx-auto bg-white rounded-xl p-8 shadow-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-gray-600 mt-2">
              Sign in to your LaunchpadAI account
            </p>
          </div>

          <SigninForm />
        </div>
      </div>
    </div>
  )
}
